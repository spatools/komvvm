"use strict";

module.exports = function (grunt) {
    require("time-grunt")(grunt);
    require("jit-grunt")(grunt, {
        buildcontrol: "grunt-build-control",
        nugetpack: "grunt-nuget",
        nugetpush: "grunt-nuget"
    });

    var config = {
        pkg: grunt.file.readJSON("package.json"),

        paths: {
            src: "src",
            build: "dist",
            temp: ".temp",
            test: "test"
        },

        options: {
            dev: grunt.option("dev")
        }
    };

    //#region Typescript

    config.ts = {
        options: {
            // target: "es5",
            // module: "umd",
            // declaration: false,
            // sourceMap: true,
            // comments: true,
            // disallowbool: true,
            // disallowimportmodule: true,
            fast: "never"
        },
        dev: {
            tsconfig: {
                tsconfig: "tsconfig.json",
                updateFiles: false,
                passThrough: true
            }
        },
        test: {
            tsconfig: {
                tsconfig: "<%= paths.test %>/tsconfig.json",
                updateFiles: false,
                passThrough: true
            }
        },
        dist: {
            options: {
                additionalFlags: "--rootDir <%= paths.src %> --outDir <%= paths.build %>/ --declaration"
            },
            tsconfig: {
                tsconfig: "tsconfig.json",
                updateFiles: false,
                passThrough: true
            }
        }
    };

    config.tslint = {
        options: {
            configFile: "tslint.json",
        },

        base: ["*.js"],
        dev: ["<%= paths.src %>/**/*.js"],
        dist: ["<%= paths.build %>/**/*.js"],
        test: ["<%= paths.test %>/**/*.js"],
        all: {
            src: ["<%= tslint.dev %>", "<%= tslint.test %>"]
        }
    };

    //#endregion

    //#region Tests

    config.karma = {
        options: {
            configFile: "karma.conf.js",
            port: 9999,
            browsers: ["PhantomJS", "Chrome", "Firefox"]
        },

        full: {
            singleRun: true,
            browsers: ["PhantomJS", "Chrome", "Firefox", "IE"]
        },

        test: {
            singleRun: true,
            browsers: ["PhantomJS"],
            reporters: ["mocha"]
        },

        server: {
            autoWatch: false,
            background: true,
            singleRun: false,
            reporters: ["dots"],
            browsers: ["PhantomJS"],
            files: [
                { src: "node_modules/es6-promise/dist/**/*.js", included: false },
                { src: "node_modules/knockout/**/*.js", included: false },
                { src: "node_modules/sinon/**/*.js", included: false },
                { src: "node_modules/should/**/*.js", included: false },
                { src: "src/**/*.{js,ts,js.map}", included: false },
                { src: "test/**/*.{js,ts,js.map}", included: false },
                { src: "test/config.js" }
            ]
        }
    };

    //#endregion

    //#region Clean

    config.clean = {
        dist: "<%= paths.build %>",
        temp: "<%= paths.temp %>",
        dev: "<%= paths.src %>/**/*.{js,js.map,d.ts}",
        test: [
            "<%= clean.dev %>",
            "<%= paths.test %>/**/*.{js,js.map,d.ts}",
            "!<%= paths.test %>/typings/**/*.d.ts",
            "!<%= paths.test %>/_references.d.ts"
        ]
    };

    //#endregion

    //#region Watch

    config.newer = {
        options: {
            override: function (detail, include) {
                if (detail.task === "ts" && detail.path.indexOf(".d.ts") !== -1) {
                    return include(true);
                }

                include(false);
            }
        }
    };

    config.watch = {
        ts: {
            files: ["<%= paths.src %>/**/*.ts", "<%= paths.test %>/**/*.ts"],
            tasks: ["ts:test"]
        },
        tslint: {
            files: ["<%= tslint.all.src %>"],
            tasks: ["newer:tslint:all"]
        },

        test: {
            files: ["<%= tslint.dev %>", "<%= tslint.test %>"],
            tasks: ["karma:server:run"]
        },

        gruntfile: {
            files: ["Gruntfile.js"],
            options: { reload: true }
        }
    };

    //#endregion

    //#region Publish

    config.nugetpack = {
        all: {
            src: "nuget/*.nuspec",
            dest: "nuget/",

            options: {
                version: "<%= pkg.version %>"
            }
        }
    };

    config.nugetpush = {
        all: {
            src: "nuget/*.<%= pkg.version %>.nupkg"
        }
    };

    config.buildcontrol = {
        options: {
            commit: true,
            push: true,
            tag: "<%= pkg.version %>",
            remote: "<%= pkg.repository.url %>",
            branch: "release"
        },

        dist: {
            options: {
                dir: "<%= paths.build %>",
                message: "Release v<%= pkg.version %>"
            }
        }
    };

    //#endregion

    //#region Custom Tasks

    grunt.registerTask("npm-publish", function () {
        var done = this.async();

        grunt.util.spawn(
            {
                cmd: "npm",
                args: ["publish"],
                opts: {
                    cwd: config.paths.build
                }
            },
            function (err, result, code) {
                if (err) {
                    grunt.log.error();
                    grunt.fail.warn(err, code);
                }

                if (code !== 0) {
                    grunt.fail.warn(result.stderr || result.stdout, code);
                }

                grunt.verbose.writeln(result.stdout);
                grunt.log.ok("NPM package " + config.pkg.version + " successfully published");

                done();
            }
        );
    });

    grunt.registerTask("assets", function () {
        copyPackage("package.json");
        copyPackage("bower.json");

        grunt.file.copy("README.md", config.paths.build + "/README.md");
        grunt.log.ok(config.paths.build + "/README.Md created !");

        writeDest(".gitignore", "node_modules/\nbower_components/");
    });

    function copyPackage(src) {
        var pkg = grunt.file.readJSON(src),
            dest = config.paths.build + "/" + dest;

        delete pkg.scripts;
        delete pkg.devDependencies;
        delete pkg.optionalDependencies;

        writeDest(src, JSON.stringify(pkg, null, 2));
    }

    function writeDest(name, content) {
        var dest = config.paths.build + "/" + name;
        grunt.file.write(dest, content);
        grunt.log.ok(dest + " created !");
    }

    //#endregion


    grunt.initConfig(config);

    grunt.registerTask("dev", ["clean:dev", "ts:dev", "tslint:dev"]);
    grunt.registerTask("build", ["clean:dist", "ts:dist", "tslint:dist", "assets"]);

    grunt.registerTask("test", ["clean:test", "ts:test", "tslint:test", "karma:test", "clean:test"]);
    grunt.registerTask("test-full", ["clean:test", "ts:test", "tslint:test", "karma:full", "clean:test"]);
    grunt.registerTask("test-watch", ["clean:test", "ts:test", "tslint:test", "karma:server:start", "watch"]);

    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);
    grunt.registerTask("publish", ["build", "nuget", "buildcontrol:dist", "npm-publish"]);

    grunt.registerTask("default", ["test", "build"]);
};