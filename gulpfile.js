const {restore, test, build, publish, run} = require('gulp-dotnet-cli');
const gulp = require('gulp');
const del = require('del');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const argv = require('yargs').argv;

const configuration = 'Release';
const version = '1.1.1';
const publishOutputDir = path.join(process.cwd(), 'output', 'publishOutput');

const environment = 'local';
const dockerEnvironment = argv.dockerenv || environment;
const dockerTag = argv.dockertag || `${dockerEnvironment}-${version}`;

// ========================= User Variables (Fill this out!) ======================================
const mainProjectName = 'TestConsoleApp';
const awsEcrAccessKey = 'AKIAJ7M32J5KLWKVTTVA';
const awsEcrSecret = "abAB227us4NrDovD7VbCMr5bePt4yoKN9dDn2pihwAPGyG";
const registryUri = '119381170469.dkr.ecr.us-east-1.amazonaws.com/jeff-win-container-testbed';
// ================================================================================================

const tag = `${registryUri}:${dockerTag}`;

// ========================= Task Definitions ======================================

// --------------------------- Local Development Tasks -----------------------------------

gulp.task('clean', () => del(['**/bin', '**/obj', 'output', 'outputs']));

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

gulp.task('docker:build-image', ['preflight'], ()=>
	spawn('docker', ['build', '-t', tag, '.'], {stdio:'inherit'})
	.then(() => spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'}))
);

gulp.task('docker:clear-images', () => 
	spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'})
);


