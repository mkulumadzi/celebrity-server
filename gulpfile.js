const gulp = require('gulp')
  , mocha = require('gulp-mocha')
  , util = require('gulp-util');

gulp.task('set-test-env', function() {
  return process.env.NODE_ENV = 'test';
})

gulp.task('test', function() {
  return gulp.src(['test/**/*.coffee'], { read: false })
    .pipe(mocha( { reporter: 'spec', compilers: 'coffee:coffee-script/register' }))
    .on('error', util.log);
})

gulp.task('watch-test', function() {
  gulp.watch(['app/**', 'config/**', 'test/**', 'index.js'], ['set-test-env', 'test']);
});
