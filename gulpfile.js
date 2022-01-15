"use strict";

import gulp from "gulp";
import imagemin from "gulp-imagemin";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import stylelint from "gulp-stylelint";
import terser from "gulp-terser";
import babelify from "babelify";
import browserify from "browserify";
import browserSync from "browser-sync";
import del from "del";
import cssnano from "cssnano";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import postcss from "gulp-postcss";
import postcssImport from "postcss-import";
import postcssNested from "postcss-nested";
import postcssProperties from "postcss-custom-properties";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import resolveConfig from "tailwindcss/resolveConfig.js";
import tailwindConfig from "./tailwind.config.cjs";
import fs from "fs";

/**
 * Notify
 *
 * Show a notification in the browser's corner.
 *
 * @param {*} message
 */
function notify(message) {
  browserSync.notify(message);
}

/**
 * Paths
 *
 * Return paths configuration.
 */
let paths = (function () {
  const basePath = ".";
  return {
    templates: `${basePath}`,
    src: `${basePath}/src`,
    dst: `${basePath}/build`,
  };
})();

/**
 * Vendors
 *
 * List of modules to get bundled into vendors minified file.
 */
let vendors = [
  "lazysizes",
  "lazysizes/plugins/object-fit/ls.object-fit",
  "lazysizes/plugins/unveilhooks/ls.unveilhooks",
  "gsap",
];

/**
 * Server Task
 *
 * Launch server using BrowserSync.
 *
 * @param {*} done
 */
function server(done) {
  browserSync.init({
    open: false,

    server: {
      baseDir: "./"
    }
  });
  done();
}

/**
 * Reload Task
 *
 * Reload page with BrowserSync.
 *
 * @param {*} done
 */
function reload(done) {
  notify("Reloading...");
  browserSync.reload();
  done();
}

/**
 * CSS Task
 *
 * The css files are run through postcss/autoprefixer and placed into one
 * single main styles.min.css file (and sourcemap)
 */
function css() {
  notify("Compiling styles...");
  return gulp
    .src(`${paths.src}/css/app.css`)
    .pipe(plumber())
    .pipe(
      stylelint({
        reporters: [{ formatter: "string", console: true }],
      })
    )
    .pipe(sourcemaps.init())
    .pipe(
      postcss([
        postcssImport({
          root: `${paths.src}/css *`,
        }),
        postcssNested(),
        postcssProperties(),
        tailwindcss(),
        autoprefixer(),
        cssnano(),
      ])
    )
    .pipe(rename("styles.min.css"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${paths.dst}/css/`))
    .pipe(browserSync.reload({ stream: true }));
}

/**
 * JS Task
 *
 * All regular .js files are collected, minified and concatonated into one
 * single scripts.min.js file (and sourcemap)
 */
function js() {
  notify("Building scripts...");
  return browserify({
    entries: `${paths.src}/js/app.js`,
    debug: true,
  })
    .external(
      vendors.map((vendor) => {
        if (vendor.expose) {
          return vendor.expose;
        }
        return vendor;
      })
    )
    .transform(babelify, {
      presets: ["@babel/preset-env"],
      plugins: [
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        ["@babel/plugin-proposal-class-properties", {}],
      ],
      sourceMaps: true,
    })
    .bundle()
    .on("error", function (err) {
      console.error(err);
      this.emit("end");
    })
    .pipe(source("scripts.js"))
    .pipe(buffer())
    .pipe(rename("scripts.min.js"))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${paths.dst}/js/`))
    .pipe(browserSync.reload({ stream: true }));
}

/**
 * Vendor Task
 *
 * All vendor .js files are collected, minified and concatonated into one
 * single vendor.min.js file (and sourcemap)
 */
function vendor() {
  const b = browserify({
    debug: true,
  });

  vendors.forEach((lib) => {
    if (lib.expose) {
      b.require(lib.path, { expose: lib.expose });
    } else {
      b.require(lib);
    }
  });

  return b
    .bundle()
    .on("error", function (err) {
      console.error(err);
      this.emit("end");
    })
    .pipe(source("vendor.js"))
    .pipe(buffer())
    .pipe(rename("vendor.min.js"))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${paths.dst}/js/`));
}

/**
 * Images Task
 *
 * All images are optimized and copied to static folder.
 */
function images() {
  notify("Copying image files...");
  return gulp
    .src([`${paths.src}/images/**/*.{jpg,png,gif,svg,ico}`])
    .pipe(plumber())
    .pipe(
      imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })
    )
    .pipe(gulp.dest(`${paths.dst}/images/`));
}

/**
 * Fonts Task
 *
 * All fonts are copied to static folder.
 */
function fonts() {
  return gulp
    .src([`${paths.src}/fonts/**/*`], {
      base: `${paths.src}`,
    })
    .pipe(gulp.dest(`${paths.dst}`));
}

/**
 * Breakpoints
 *
 * Tailwind breakpoints are written in a breakpoints.json file to be used
 * in JS, this way we don't need to load useless code (up to 200kb).
 */
function breakpoints(done) {
  let json = {};

  const fullConfig = resolveConfig(tailwindConfig);

  Object.keys(fullConfig.theme.screens).forEach(
    (key) => (json[key] = parseInt(fullConfig.theme.screens[key]))
  );

  fs.writeFile(`${paths.src}/breakpoints.json`, JSON.stringify(json), done);
}

function watch() {
  gulp.watch(`${paths.src}/js/**/*.js`, js);
  gulp.watch(`${paths.src}/images/**/*`, gulp.series(images, reload));
  gulp.watch(`${paths.src}/fonts/**/*`, gulp.series(fonts, reload));
  gulp.watch(`${paths.templates}/**/*.html`, gulp.series(css, reload));
  gulp.watch(`./tailwind.config.js`, gulp.series(css, breakpoints, js));
}

function clean() {
  return del([`${paths.dst}`]);
}

const run = gulp.series(
  gulp.parallel(vendor, breakpoints),
  gulp.parallel(
    js,
    css,
    fonts,
    images
  ),
  gulp.parallel(server, watch)
);

const build = gulp.series(
  clean,
  vendor,
  breakpoints,
  gulp.parallel(
    js,
    css,
    fonts,
    images
  )
);

export { run as default, build };