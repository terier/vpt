var gulp    = require('gulp');
var sass    = require('gulp-sass');
var run     = require('gulp-run');
var concat  = require('gulp-concat');
var shell   = require('gulp-shell');
var del     = require('del');

gulp.task('sass', function() {
    return gulp.src('app/css/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('build/css'));
});

gulp.task('glsl', shell.task([
    'bin/concader -x -n MIXINS app/glsl/*.glsl > build/js/mixins.js',
    'bin/concader -n SHADERS app/glsl/*.frag app/glsl/*.vert > build/js/shaders.js',
]));

gulp.task('js', function() {
    return gulp.src('app/js/**/*.js')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('build/js'));
});

gulp.task('watch', function() {
    gulp.watch('app/css/**/*.scss', ['sass']);
    gulp.watch('app/js/**/*.js', ['js']);
    gulp.watch('app/glsl/**', ['glsl']);
});

gulp.task('build', function() {
    gulp.start('sass', 'js', 'glsl');
});

gulp.task('clean', function() {
    return del('build');
});
