const __karma__ = (<any>window).__karma__;
const TEST_REGEXP = /(test)\/(.*)\.js$/i;
const REPLACE_REGEXP = /(^\/base\/)|(\.js$)/g;

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: "/base",

    paths: {
        "es6-promise": "node_modules/es6-promise/dist/es6-promise.auto",
        "knockout": "node_modules/knockout/build/output/knockout-latest.debug",
        "should": "node_modules/should/should",
        "sinon": "node_modules/sinon/pkg/sinon"
    },

    deps: Object.keys(__karma__.files)
        .filter(file => TEST_REGEXP.test(file) && file.indexOf("config") === -1 && file.indexOf("helpers") === -1)
        .map(file => file.replace(REPLACE_REGEXP, "")),

    callback: __karma__.start
});
