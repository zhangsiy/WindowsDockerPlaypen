//##########################################
// TODO:
//   * Real environment from git branch
//   * Real version
//   * Real storage for AWS secrets
//   * Real tag/repo handling for build images
//##########################################

const {restore, test, build, publish, run} = require('gulp-dotnet-cli');
const gulp = require('gulp');
const del = require('del');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const argv = require('yargs').argv;

const configuration = 'Release';
const version = '1.1.1';
const publishOutputDir = path.join(process.cwd(), 'output', 'publishOutput');
const sourceDir = path.join(process.cwd(), 'src');
const outputDir = path.join(process.cwd(), 'output');

const dockerFileDir = path.join(process.cwd(), 'docker');
const buildDockerFilePath = path.join(dockerFileDir, 'build', 'Dockerfile');
const bundleDockerFilePath = path.join(dockerFileDir, 'bundle', 'Dockerfile');

const environment = 'local';
const dockerEnvironment = argv.dockerenv || environment;
const dockerTag = argv.dockertag || `${dockerEnvironment}-${version}`;

// ========================= User Variables (Fill this out!) ======================================
const mainProjectName = 'TestConsoleApp';
const registryUri = '119381170469.dkr.ecr.us-east-1.amazonaws.com/jeff-win-container-testbed';
// ================================================================================================

const executableName = `${mainProjectName}.exe`;
const buildImageTag = `build:${dockerTag}`;
const bundleImageTag = `${registryUri}:${dockerTag}`;

// ========================= Task Definitions ======================================

// --------------------------- Common Development Tasks -----------------------------------

gulp.task('clean', () => del(['**/bin', '**/obj', 'output/*']));

gulp.task('restore', ['clean'], () => 
	gulp.src('./src/*.sln')
		.pipe(restore())
);

gulp.task('build', ['restore'], () => 
	gulp.src('./src/*.sln')
		.pipe(build(
			{
				configuration: configuration,
				version: version
			}
		))
);

gulp.task('test', ['build'], () =>
	gulp.src('src/**/*Tests'.csproj)
		.pipe(test(
			{
				configuration: configuration,
				noBuild: true
			}
		))
);

gulp.task('publish', ['build'], () =>
	gulp.src(`./src/${mainProjectName}`)
		.pipe(publish(
			{
				configuration: configuration,
				version: version,
				output: publishOutputDir
			}
		))
);

gulp.task('start', [], () => {
		if (argv.rebuild) {
			gulp.start('publish', () => 
				spawn(`${publishOutputDir}/${mainProjectName}.exe`, [], { stdio: 'inherit' })
			);
		} else {
			spawn(`${publishOutputDir}/${mainProjectName}.exe`, [], { stdio: 'inherit' });
		}
	}
);

gulp.task('preflight', ['publish']);


// --------------------------- Docker Tasks -----------------------------------

gulp.task('docker:compile-build-image', [], () =>
	spawn('docker', ['build', '-t', buildImageTag, '-f', buildDockerFilePath, '.'], {stdio:'inherit'})
	.then(() => spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'}))
);

gulp.task('docker:build-app', ['docker:compile-build-image'], () => 
	spawn('docker', ['run', '-it', '--rm', '-v', `${sourceDir}:c:\\app\\src`, '-v', `${outputDir}:c:\\app\\output`, buildImageTag, 'gulp publish'], {stdio:'inherit'})
);

gulp.task('docker:compile-bundle-image', ['docker:build-app'], () =>
	spawn('docker', ['build', '-t', bundleImageTag, '-f', bundleDockerFilePath, '--build-arg', `executable=${executableName}`, '--build-arg', 'artifactdir=.\\output\\publishOutput', '.'], {stdio:'inherit'})
	.then(() => spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'}))
);

gulp.task('docker:run-app', ['docker:compile-bundle-image'], () =>
	spawn('docker', ['run', '-it', '--rm', bundleImageTag], {stdio:'inherit'})
);

gulp.task('docker:clear-images', () => 
	spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'})
);
