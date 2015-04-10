'use strict';

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require("jit-grunt")(grunt, {
        nugetpack: "grunt-nuget",
        nugetpush: "grunt-nuget"
    });
    require('time-grunt')(grunt); // Time how long tasks take. Can help when optimizing build times

    var options = {
        dev: grunt.option('dev')
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),
        paths: {
            src: 'src',
            build: 'dist',
            temp: '.temp',
            test: 'test'
        },

        typescript: {
            options: {
                target: "es3",
                module: "amd",
                sourceMap: false,
                declaration: false,
                comments: false,
                disallowbool: true,
                disallowimportmodule: true
            },
            dev: {
                src: ["_definitions.d.ts", "<%= paths.src %>/**/*.ts"],
                options: {
                    sourceMap: true
                }
            },
            test: {
                src: "<%= paths.test %>/**/*.ts",
                options: {
                    sourceMap: true
                }
            },
            declaration: {
                src: ["_definitions.d.ts", "<%= paths.src %>/**/*.ts"],
                dest: "<%= paths.temp %>/",
                options: {
                    basePath: '<%= paths.src %>',
                    declaration: true
                }
            },
            dist: {
                src: ["_definitions.d.ts", "<%= paths.src %>/**/*.ts"],
                dest: "<%= paths.build %>/",
                options: {
                    basePath: '<%= paths.src %>'
                }
            }
        },

        concat: {
            declaration: {
                src: [
                    "<%= paths.src %>/base.d.ts",
                    "<%= paths.temp %>/temp.d.ts"
                ],
                dest: "<%= paths.build %>/komvvm.d.ts"
            }
        },

        tsdamdconcat: {
            options: {
                removeReferences: true,
                basePath: "<%= paths.temp %>",
                prefixPath: "koutils"
            },
            declaration: {
                src: "<%= paths.temp %>/*.d.ts",
                dest: "<%= paths.temp %>/temp.d.ts"
            }
        },

        jshint: {
            options: {
                jshintrc: "jshint.json",
            },

            base: ["*.js"],
            dev: ["<%= paths.src %>/**/*.js"],
            dist: ["<%= paths.build %>/**/*.js"],
            test: ["<%= paths.test %>/**/*.js"]
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            dev: {
                src: "<%= paths.src %>/**/*.ts"
            },
            test: {
                src: "<%= paths.test %>/**/*.ts"
            }
        },

        clean: {
            dev: [
                "<%= paths.src %>/**/*.d.ts",
                "!<%= paths.src %>/base.d.ts",
                "<%= paths.src %>/**/*.js",
                "<%= paths.src %>/**/*.js.map"
            ],
            test: [
                "<%= paths.test %>/**/*.{d.ts,js,js.map}"
            ],
            temp: [
                "<%= paths.temp %>/**/*.*"
            ]
        },

        connect: {
            test: {
                options: {
                    port: "8080",
                    open: "http://localhost:8080/test/index.html",
                    livereload: 12345
                }
            }
        },

        mocha: {
            test: ["<%= paths.test %>/index.html"]
        },

        watch: {
            tslint: {
                files: ['<%= tslint.dev.src %>'],
                tasks: ['tslint:dev']
            },
            jshint: {
                files: ['<%= jshint.dev %>'],
                tasks: ['jshint:dev']
            },
            dev: {
                files: ['<%= typescript.dev.src %>'],
                tasks: ['typescript:dev']
            },
            test: {
                files: ['<%= typescript.test.src %>'],
                tasks: ['typescript:test']
            },

            livereload: {
                options: {
                    livereload: "<%= connect.test.options.livereload %>"
                },
                files: [
                    "<%= paths.src %>/**/*.js",
                    "<%= paths.test %>/**/*.js",
                    "<%= paths.test %>/**/*.html"
                ]
            }
        },

        nugetpack: {
            all: {
                src: "nuget/*.nuspec",
                dest: "nuget/",

                options: {
                    version: "<%= pkg.version %>"
                }
            }
        },
        nugetpush: {
            all: {
                src: "nuget/*.<%= pkg.version %>.nupkg"
            }
        }
    });

    grunt.registerTask("fixdecla", function () {
        var content = grunt.file.read("dist/komvvm.d.ts");
        content = content.replace(/\.{2}\/typings/g, "../../../typings");
        grunt.file.write("dist/komvvm.d.ts", content);
    });

    grunt.registerTask("dev", ["tslint:dev", "typescript:dev", "jshint:dev"]);
    grunt.registerTask("declaration", ["typescript:declaration", "tsdamdconcat:declaration", "concat:declaration", "clean:temp", "fixdecla"]);
    grunt.registerTask("build", ["tslint:dev", "typescript:dist", "jshint:dist", "declaration"]);

    grunt.registerTask("test", ["dev", "tslint:test", "typescript:test", "jshint:test", "mocha:test", "clean"]);
    grunt.registerTask("btest", ["dev", "tslint:test", "typescript:test", "jshint:test", "connect:test", "watch"]);

    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);

    grunt.registerTask("default", ["clean", "test", "build"]);
};