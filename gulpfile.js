const {restore, test, build, publish, run} = require('gulp-dotnet-cli');
const gulp = require('gulp');
const del = require('del');
const path = require('path');
const exec = require('child-process-promise').exec;
const spawn = require('child-process-promise').spawn;
const argv = require('yargs').argv;

const configuration = 'Release';
const version = '1.1.1';
const publishOutputDir = path.join(process.cwd(), 'output', 'publishOutput');

const environment = 'local';
const dockerEnvironment = argv.dockerenv || environment;
const dockerTag = argv.dockertag || `${dockerEnvironment}-${version}`;
const registryUri = 'wincontainertest';
const tag = `${registryUri}:${dockerTag}`;

// ========================= User Variables (Fill this out!) ======================================
const mainProjectName = 'TestConsoleApp';

// ========================= Task Definitions ======================================

gulp.task('clean', () => del(['**/bin', '**/obj', 'output', 'outputs']));

gulp.task('npm-install', () =>
	spawn('npm', ['install'], {stdio:'inherit'})
);

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

gulp.task('preflight', ['publish']);

gulp.task('docker:compile', ['preflight'], ()=>
	spawn('docker', ['build', '-t', tag, '.'], {stdio:'inherit'})
	.then(() => spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'}))
);

gulp.task('docker:clear-images', () => 
	spawn('docker', ['image', 'prune', '-f'], {stdio:'inherit'})
);


