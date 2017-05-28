var gulp       = require('gulp');
var sass       = require('gulp-sass');
var run        = require('gulp-run');
var concat     = require('gulp-concat');
var shell      = require('gulp-shell');
var imagemin   = require('gulp-imagemin');
var htmlmin    = require('gulp-htmlmin');
var cache      = require('gulp-cache');
var uglify     = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var htmlToJs   = require('gulp-html-to-js');
var del        = require('del');

// --------------------------------------------------------

gulp.task('sass', function() {
    return gulp.src('app/css/**/*.scss')
        .pipe(sass())
        .pipe(concat('main.css'))
        .pipe(gulp.dest('build/css'));
});

gulp.task('glsl', shell.task([
    'mkdir -p build/js',
    'bin/concader -x -n MIXINS app/glsl/*.glsl > build/js/mixins.js',
    'bin/concader -n SHADERS app/glsl/*.frag app/glsl/*.vert > build/js/shaders.js',
]));

gulp.task('js', function() {
    return gulp.src('app/js/**/*.js')
        .pipe(concat('main.js'))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/js'));
});

gulp.task('images', function(){
    return gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg|ico|bmp)')
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('build/images'));
});

gulp.task('html', function() {
    return gulp.src(['app/**/*.html', '!app/templates/**/*'])
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('build'));
});

gulp.task('templates', function() {
    return gulp.src('app/templates/**/*.html')
        .pipe(htmlToJs({
            concat: 'templates.js',
            global: 'window.TEMPLATES'
        }))
        .pipe(gulp.dest('build/js'));
});

// --------------------------------------------------------

gulp.task('watch', function() {
    gulp.watch('app/css/**/*.scss', ['sass']);
    gulp.watch('app/js/**/*.js', ['js']);
    gulp.watch('app/images/**/*.+(png|jpg|jpeg|gif|svg|ico|bmp)', ['images']);
    gulp.watch('app/glsl/**/*.(frag|vert|glsl)', ['glsl']);
    gulp.watch(['app/**/*.html', '!app/templates/**/*'], ['html']);
    gulp.watch(['app/templates/**/*'], ['templates']);
});

gulp.task('build', function() {
    gulp.start('sass', 'js', 'glsl', 'images', 'html', 'templates');
});

gulp.task('clean', function() {
    return del('build');
});

gulp.task('default', ['watch']);
