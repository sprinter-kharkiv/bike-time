'use strict';

const gulp = require('gulp');
const prefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cssmin = require('gulp-clean-css');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const stylelint = require('gulp-stylelint');
const imagemin = require('gulp-imagemin');
const rigger = require('gulp-rigger');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const concat    = require('gulp-concat');
const svgSprite = require('gulp-svg-sprites');

gulp.task('set-dev-node-env', function (done) {
  process.env.NODE_ENV = config.env = 'development';
  done();
});

gulp.task('set-prod-node-env', function (done) {
  process.env.NODE_ENV = config.env = 'production';
  done();
});

const path = {
    lint: {
        style: ['src/sсss/**/*.scss']
    },
    build: {
        style: 'dist/css/',
        html: 'dist/',
        img: 'dist/img/',
        js: 'dist/js/',
        fonts: 'dist/fonts/',
        svgSprite: {
            folder: 'dist/img/svg-sprites/',
            file: '_svg-sprite.html'
        }
    },
    src: {
        style: 'src/scss/*.scss',
        html: 'src/index.html',
        img: 'src/img/**/*',
        js: 'src/js/**/*.js',
        fonts: 'src/fonts/**/*.{woff,woff2}',
        svgSprite: 'src/img/svg-sprite/*.svg'
    },
    watch: {
        style: 'src/scss/**/*.scss',
        html: 'src/**/*.html',
    },
};





gulp.task('css:lint', function (done) {
    gulp.src(path.lint.style, {since: gulp.lastRun('css:lint')})
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(stylelint({
            failAfterError: true,
            syntax: 'scss',
            reporters: [
                {formatter: 'string', console: true}
            ]
        }));
    done();
});


gulp.task('styles', function () {
    return gulp.src(path.src.style)
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(prefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.build.style))
        .pipe(browserSync.reload({
            stream: true
        }))

});

// HTML
gulp.task('html', function () {
  return gulp.src(path.src.html)
      .pipe(rigger())
      .pipe(gulp.dest(path.build.html))
      .pipe(browserSync.reload({
        stream: true
      }));
});

// Images
gulp.task('img',function () {
  return gulp.src(path.src.img)
        .pipe(imagemin())
        .pipe(gulp.dest(path.build.img))
        .pipe(browserSync.reload({
          stream: true
        }));
});


gulp.task('fonts', function (done) {
  gulp.src(path.src.fonts)
      .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
      .pipe(gulp.dest(path.build.fonts))
      .pipe(reload({
        stream: true
      }));
  done();
});

gulp.task('svg-build', function () {
  return gulp.src(path.src.svgSprite)
      // .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
      // .pipe(imagemin([
      //   imagemin.svgo({
      //     plugins: [
      //       {removeViewBox: false},
      //       {removeTitle: false},
      //       {cleanupIDs: true}
      //     ]
      //   })
      // ]))
      .pipe(svgSprite({
        mode: 'symbols',
        preview: false,
        svg: {
          symbols: path.build.svgSprite.file
        },
        transformData(data) {
          data.svg.map((item) => {
            // change id attribute
            item.data = item.data.replace(/id="([^"]+)"/gm, `id="${item.name}-$1"`);

            // change id in fill attribute
            item.data = item.data.replace(/fill="url\(#([^"]+)\)"/gm, `fill="url(#${item.name}-$1)"`);

            // change id in mask attribute
            item.data = item.data.replace(/mask="url\(#([^"]+)\)"/gm, `mask="url(#${item.name}-$1)"`);

            // change id in filter attribute
            item.data = item.data.replace(/filter="url\(#([^"]+)\)"/gm, `filter="url(#${item.name}-$1)"`);

            // replace double id for the symbol tag
            item.data = item.data.replace(`id="${item.name}-${item.name}"`, `id="${item.name}-$1"`);
            return item;
          });
          return data; // modify the data and return it
        }
      }))
      .pipe(gulp.dest(path.build.svgSprite.folder))
      // .pipe(reload({
      //   stream: true
      // }));
});

// JAVASCRIPT
gulp.task('javascript', function () {
  return gulp.src(path.src.js)
      .pipe(babel({
          presets: ['@babel/env']
      }))
      .pipe(uglify())
      .pipe(rename({suffix: '.min', prefix: ''}))
      .pipe(gulp.dest(path.build.js))
      .pipe(browserSync.reload({
        stream: true
      }));
});
// JS LIBS
gulp.task('js-libs', function () {
  return gulp.src([
      'node_modules/jquery/dist/jquery.js',
      'node_modules/materialize-css/dist/js/materialize.js',
  ])
      .pipe(concat('libs.js'))
      .pipe(uglify())
      .pipe(rename({suffix: '.min', prefix: ''}))
      .pipe(gulp.dest(path.build.js))
      .pipe(browserSync.reload({
        stream: true
      }));
});

gulp.task(
    'build',
    gulp.series(
        'set-prod-node-env',
        // gulp.parallel('css:lint', 'js:lint'),
        'css:lint',
        gulp.parallel('styles', 'javascript', 'svg-build'),
        gulp.parallel('img', 'html', 'fonts')
    )
);

const config = {
  server: {
    baseDir: './dist'
  },
  host: 'localhost',
  port: 3000
};

gulp.task('browserSync', function (done) {
    browserSync(config);
    done();
});


gulp.task('watch', function () {
    gulp.watch(path.watch.style, gulp.series('css:lint', 'styles'));
    gulp.watch(path.watch.html, gulp.series('html'));
});

gulp.task('default', gulp.series('build', gulp.parallel('browserSync', 'watch')));

