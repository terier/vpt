var gulp       = require('gulp');
var sass       = require('gulp-sass');
var concat     = require('gulp-concat');
var shell      = require('gulp-shell');
var imagemin   = require('gulp-imagemin');
var htmlmin    = require('gulp-htmlmin');
var cache      = require('gulp-cache');
var uglify     = require('gulp-uglify');
var cleanCSS   = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var htmlToJs   = require('gulp-html-to-js');
var del        = require('del');

var debug = !!process.env.DEBUG;

// --------------------------------------------------------

var jsFiles = [
    'app/js/math/**/*.js',
    'app/js/dialogs/**/*.js',
    'app/js/**/*.js'
];
var sassFiles = 'app/css/**/*.scss';
var glslFiles = 'app/glsl/**/*.(frag|vert|glsl)';
var imageFiles = 'app/images/**/*.+(png|jpg|jpeg|gif|svg|ico|bmp)';
var templateFiles = 'app/templates/**/*.html';
var htmlFiles = [
    'app/**/*.html',
    '!app/templates/**/*'
];

gulp.task('sass', function() {
    if (debug) {
        return gulp.src(sassFiles)
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(gulp.dest('build/css'));
    } else {
        return gulp.src(sassFiles)
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(sourcemaps.init())
            .pipe(cleanCSS())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build/css'));
    }
});

gulp.task('glsl', shell.task([
    'mkdir -p build/js',
    'bin/concader -x -n MIXINS app/glsl/*.glsl > build/js/mixins.js',
    'bin/concader -n SHADERS app/glsl/*.frag app/glsl/*.vert > build/js/shaders.js',
]));

gulp.task('js', function() {
    if (debug) {
        return gulp.src(jsFiles)
            .pipe(concat('main.js'))
            .pipe(gulp.dest('build/js'));
    } else {
        return gulp.src(jsFiles)
            .pipe(concat('main.js'))
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build/js'));
    }
});

gulp.task('images', function(){
    return gulp.src(imageFiles)
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('build/images'));
});

gulp.task('html', function() {
    return gulp.src(htmlFiles)
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('build'));
});

gulp.task('templates', function() {
    return gulp.src(templateFiles)
        .pipe(htmlToJs({
            concat: 'templates.js',
            global: 'window.TEMPLATES'
        }))
        .pipe(gulp.dest('build/js'));
});

// --------------------------------------------------------

gulp.task('watch', function() {
    gulp.watch(sassFiles, ['sass']);
    gulp.watch(jsFiles, ['js']);
    gulp.watch(imageFiles, ['images']);
    gulp.watch(glslFiles, ['glsl']);
    gulp.watch(htmlFiles, ['html']);
    gulp.watch(templateFiles, ['templates']);
});

gulp.task('build', function() {
    gulp.start('sass', 'js', 'glsl', 'images', 'html', 'templates');
});

gulp.task('clean', function() {
    return del('build');
});

gulp.task('default', ['watch']);
