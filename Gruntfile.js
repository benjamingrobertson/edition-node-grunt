/******************************************************
 * PATTERN LAB NODE
 * EDITION-NODE-GRUNT
 * The grunt wrapper around patternlab-node core, providing tasks to interact with the core library and move supporting frontend assets.
******************************************************/

module.exports = function (grunt) {

  var path = require('path'),
      argv = require('minimist')(process.argv.slice(2));

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);


  /******************************************************
   * PATTERN LAB CONFIGURATION
  ******************************************************/

  //read all paths from our namespaced config file
  var config = require('./patternlab-config.json'),
    pl = require('patternlab-node')(config);

  function paths() {
    return config.paths;
  }

  function getConfiguredCleanOption() {
    return config.cleanPublic;
  }

  grunt.registerTask('patternlab', 'create design systems with atomic design', function (arg) {

    if (arguments.length === 0) {
      pl.build(function(){}, getConfiguredCleanOption());
    }

    if (arg && arg === 'version') {
      pl.version();
    }

    if (arg && arg === "patternsonly") {
      pl.patternsonly(function(){},getConfiguredCleanOption());
    }

    if (arg && arg === "help") {
      pl.help();
    }

    if (arg && arg === "liststarterkits") {
      pl.liststarterkits();
    }

    if (arg && arg === "loadstarterkit") {
      pl.loadstarterkit(argv.kit, argv.clean);
    }

    if (arg && (arg !== "version" && arg !== "patternsonly" && arg !== "help" && arg !== "liststarterkits" && arg !== "loadstarterkit")) {
      pl.help();
    }
  });


  grunt.initConfig({
    /******************************************************
     * Sass
    ******************************************************/
    sass: {
      devel: {
        options: {
          update: true,
          style: 'expanded',
          sourcemap: 'auto'
        },
        files: {
          './public/css/style.css': './source/css/main.sass',
        }
      },
      prod: {
        options: {
          update: true,
          compass: true,
          style: 'compressed'
        },
        files: {
          './public/css/style.css': './source/css/main.sass',
        }
      }
    },
    sasslint: {
      options: {
        configFile: '.sass-lint.yml'
      },
      target: ['source/css/**/*.sass']
    },

    postcss: {
      options: {
        map: {
          inline: false,
          annotation: './public/css/maps/'
        },

        processors: [
          require('autoprefixer')({
            browsers: [
              'last 2 versions',
              'ios 8',
              'ie 9'
            ]
          }),
          require('cssnano')({
            options: {
              sourcemap: true
            },
            dist: {
              files: {
                './public/css/style.css': './public/css/style.css'
              }
            }
          })
        ]
      },
      dist: {
        src: './public/css/style.css'
      }
    },


    /******************************************************
     * SVG
    ******************************************************/

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: './source/svg/icons/',
          src: ['*.svg'],
          dest: './public/svg/icons-optimized/'
        }]
      }
    },
    svgstore: {
      options: {
        svg: {
          'xmlns': 'http://www.w3.org/2000/svg',
          'xmlns:xlink': 'http://www.w3.org/1999/xlink'
        }
      },
      default: {
        files: {
          './public/svg/defs.svg': ['./public/svg/icons-optimized/*.svg']
        }
      }
    },


    /******************************************************
     * COPY TASKS
    ******************************************************/
    copy: {
      main: {
        files: [
          // { expand: true, cwd: path.resolve(paths().source.sass), src: '**/*.css', dest: path.resolve(paths().public.css) },
          { expand: true, cwd: path.resolve(paths().source.images), src: '**/*', dest: path.resolve(paths().public.images) },
          { expand: true, cwd: path.resolve(paths().source.fonts), src: '**/*', dest: path.resolve(paths().public.fonts) },
          { expand: true, cwd: path.resolve(paths().source.root), src: 'favicon.ico', dest: path.resolve(paths().public.root) },
          { expand: true, cwd: path.resolve(paths().source.styleguide), src: ['*', '**'], dest: path.resolve(paths().public.root) },
          // slightly inefficient to do this again - I am not a grunt glob master. someone fix
          { expand: true, flatten: true, cwd: path.resolve(paths().source.styleguide, 'styleguide', 'css', 'custom'), src: '*.css)', dest: path.resolve(paths().public.styleguide, 'css') }
        ]
      }
    },

    /******************************************************
     * SERVER AND WATCH TASKS
    ******************************************************/
    watch: {
      all: {
        files: [
          path.resolve(paths().source.sass + '**/*.sass'),
          path.resolve(paths().source.svg + '**/*.svg'),
          path.resolve(paths().source.styleguide + 'css/*.css'),
          path.resolve(paths().source.patterns + '**/*'),
          path.resolve(paths().source.fonts + '/*'),
          path.resolve(paths().source.images + '/*'),
          path.resolve(paths().source.data + '*.json'),
          path.resolve(paths().source.js + '/*.js'),
          path.resolve(paths().source.root + '/*.ico')
        ],
        tasks: ['default', 'bsReload:css']
      }
    },
    browserSync: {
      dev: {
        options: {
          server:  path.resolve(paths().public.root),
          watchTask: true,
          watchOptions: {
            ignoreInitial: true,
            ignored: '*.html'
          },
          snippetOptions: {
            // Ignore all HTML files within the templates folder
            blacklist: ['/index.html', '/', '/?*']
          },
          plugins: [
            {
              module: 'bs-html-injector',
              options: {
                files: [path.resolve(paths().public.root + '/index.html'), path.resolve(paths().public.styleguide + '/styleguide.html')]
              }
            }
          ],
          notify: {
            styles: [
              'display: none',
              'padding: 15px',
              'font-family: sans-serif',
              'position: fixed',
              'font-size: 1em',
              'z-index: 9999',
              'bottom: 0px',
              'right: 0px',
              'border-top-left-radius: 5px',
              'background-color: #1B2032',
              'opacity: 0.4',
              'margin: 0',
              'color: white',
              'text-align: center'
            ]
          }
        }
      }
    },
    bsReload: {
      css: path.resolve(paths().public.root + '**/*.css'),
      svg: path.resolve(paths().public.root + '**/*.svg'),
      js: path.resolve(paths().public.root + '**/*.js'),
    }
  });

  /******************************************************
   * COMPOUND TASKS
  ******************************************************/

  grunt.registerTask('default', ['upup:sass', 'patternlab', 'copy:main']);
  grunt.registerTask('upup:sass', ['sasslint', 'sass:devel', 'postcss']);
  grunt.registerTask('upup:svg', ['svgmin', 'svgstore']);
  grunt.registerTask('upup:prod', ['upup:svg', 'sasslint', 'sass:prod', 'postcss']);
  grunt.registerTask('patternlab:build', ['upup:prod', 'patternlab', 'copy:main']);
  grunt.registerTask('patternlab:watch', ['patternlab', 'copy:main', 'watch:all']);
  grunt.registerTask('patternlab:serve', ['upup:sass', 'upup:svg', 'patternlab', 'copy:main', 'browserSync', 'watch:all']);

  grunt.registerTask('prod', ['patternlab:build', 'index']);
  grunt.registerTask('index', ['copy:after']);

};
