'use strict';
/*jshint asi: true */

var test     = require('tap').test
var fs       = require('fs');
var through  = require('through2')
var exorcist = require('../')

var fixtures = __dirname + '/fixtures';
var mapfile = fixtures + '/bundle.js.map';

// This base path is baken into the source maps in the fixtures.
var base = '/Users/thlorenz/dev/projects/exorcist';

function setup() {
  if (fs.existsSync(mapfile)) fs.unlinkSync(mapfile);
}

test('\nwhen piping a bundle generated with browserify through exorcist without adjusting properties', function (t) {
  setup();
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(mapfile))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=bundle.js.map', 'last line as source map url pointing to .js.map file')

      var map = JSON.parse(fs.readFileSync(mapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sources[0].indexOf(base), 0, 'uses absolute source paths')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, '', 'leaves source root an empty string')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting url', function (t) {
  setup();
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(mapfile, 'http://my.awseome.site/bundle.js.map'))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(mapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, '', 'leaves source root an empty string')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting root and url', function (t) {
  setup();
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(mapfile, 'http://my.awseome.site/bundle.js.map', 'http://my.awesome.site/src'))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(mapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, 'http://my.awesome.site/src', 'adapts source root')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting root, url, and base', function (t) {
  setup();
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(mapfile, 'http://my.awseome.site/bundle.js.map', 'http://my.awesome.site/src', base))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(mapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sources[0].indexOf(base), -1, 'uses relative source paths')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, 'http://my.awesome.site/src', 'adapts source root')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify thats missing a map through exorcist' , function (t) {
  setup();
  var data = ''
  var missingMapEmitted = false;
  fs.createReadStream(fixtures + '/bundle.nomap.js')
    .pipe(exorcist(mapfile))
    .on('missing-map', function () { missingMapEmitted = true })
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      t.equal(lines.length, 25, 'pipes entire bundle including prelude')
      t.ok(missingMapEmitted, 'emits missing-map event')

      cb();
      t.end()
    }
})
