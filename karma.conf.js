// Karma configuration
// Generated on Sat Mar 19 2016 11:22:22 GMT+0100 (Paris, Madrid)

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "requirejs"],


    // list of files / patterns to load in the browser
    files: [
      "test/config.js",
      { pattern: "node_modules/knockout/**/*.js", included: false },
      { pattern: "node_modules/sinon/**/*.js", included: false },
      { pattern: "node_modules/should/**/*.js", included: false },
      { pattern: "src/**/*.js", included: false },
      { pattern: "src/**/*.ts", included: false, watched: false, nocache: true },
      { pattern: "src/**/*.js.map", included: false, watched: false, nocache: true },
      { pattern: "test/**/*.js", included: false },
      { pattern: "test/**/*.ts", included: false, watched: false, nocache: true },
      { pattern: "test/**/*.js.map", included: false, watched: false, nocache: true }
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: "dots", "progress"
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ["PhantomJS", "Chrome", "IE", "Firefox", "Opera"],
    browsers: ["PhantomJS"],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
