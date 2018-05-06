/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'lint', 'scripts','service-worker'], function() {
	gulp.watch('sass/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['lint', 'scripts']);
	gulp.watch('./**.html', ['copy-html']);
	gulp.watch('./service-worker.js', ['service-worker']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		browser: 'google chrome',
		server: './dist'
	});
});

gulp.task('prod', ['copy-html', 'copy-images', 'styles', 'lint', 'scripts-dist']);

gulp.task('scripts', function() {
	gulp.src('js/**/*.js')
		.pipe(babel())
		//.pipe(concat('scripts.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function() {
	gulp.src('js/**/*.js')
		.pipe(babel())
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('lint', function() {
	return gulp.src(['js/**/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

gulp.task('service-worker', function() {
	gulp.src('./service-worker.js')
		.pipe(gulp.dest('./dist'));

	gulp.src('./manifest.json')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-html', function() {
	gulp.src('./**.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
	gulp.src('img/**/*')
		.pipe(imagemin({
			progressive: true,
			use: [pngquant()]
		}))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function() {
	gulp.src('sass/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

// Resize images
gulp.task('resize-images', () => {  
    const front_end_images =
        gulp.src('/img/**/*')

    del(['dist/images/*'])

    front_end_images
        .pipe(imageResize({
            width: 200,
            height: 200,
            crop: true,
            upscale: false
        }))
        .pipe(rename(function (path) {
            path.basename += '-full'
        }))
        .pipe(gulp.dest('public/images'))

    front_end_images
        .pipe(imageResize({
            width: 100,
            height: 100,
            crop: true,
            upscale: false
        }))
        .pipe(rename(function (path) {
            path.basename += '-full'
        }))
        .pipe(gulp.dest('public/images'))

    front_end_images
        .pipe(imageResize({
            width: 100,
            height: 100,
            crop: true,
            upscale: false
        }))
        .pipe(rename(function (path) {
            path.basename += '-thumb'
        }))
        .pipe(gulp.dest('public/images'))
});
