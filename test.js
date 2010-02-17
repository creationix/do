// This file is just a mess of examples of how to use the library.

var Do = require('./lib/do');
var fs = require('./lib/do/fs')
process.mixin(require('sys'));
function debug(message, showHidden) {
  puts(inspect(message, showHidden));
}
function show_error(trace) {
  puts("ERROR: " + inspect(trace));
}


// A very slow error to make sure that no success message is emitted if there
// is an error anywhere.
function slow_error() { return function (callback, errback) {
  setTimeout(function () {
    errback(new Error("Yikes!"));
  }, 500);
}}

Do.parallel(
  fs.read(__filename),
  slow_error()
)(function (bad, good) {
  puts("Good: " + inspect(arguments));
}, show_error);

Do.parallel(
  fs.read(__filename)
)(function (bad, good) {
  puts("Good: " + inspect(arguments));
}, show_error);

Do.parallel(
  Do.parallel([
    fs.read(__filename),
    fs.read(__filename)
  ]),
  fs.read(__filename)
)(function () {
  puts("Good: " + inspect(arguments));
}, show_error);

// Filter callback that only let's files through by using stat
function only_files(filename, callback, errback) {
  fs.stat(filename)(function (stat) {
    callback(stat.isFile());
  }, errback);
}

// Filter that replaces a filename with the pair of filename and content
function marked_read(filename, callback, errback) {
  fs.read(filename)(function (data) {
    if (data.length < 10) {
      errback(new Error(filename + " is too small!"));
    } else {
      callback([filename, data]);
    }
  }, errback);
}

function check_and_load(filename, callback, errback) {
  fs.stat(filename)(function (stat) {
    if (stat.isFile()) {
      marked_read(filename, callback, errback);
    } else {
      callback();
    }
  }, errback);
}

function loaddir(path) { return function (callback, errback) {
  fs.readdir(path)(function (filenames) {
    Do.filter(filenames, only_files)(function (filenames) {
      Do.map(filenames, marked_read)(callback, errback);
    }, errback);
  }, errback);
}}
loaddir(__dirname)(debug, show_error);

function fast_loaddir(path) { return function (callback, errback) {
  fs.readdir(path)(function (filenames) {
    Do.filter_map(filenames, check_and_load)(callback, errback);
  }, errback);
}}
fast_loaddir(__dirname)(debug, show_error);

function get_keywords(text) { return function (callback, errback) {
  setTimeout(function () {
    var last;
    var words = text.toLowerCase().replace(/[^a-z ]/g, '').split(' ').sort().filter(function (word) {
      if (last === word) {
        return false;
      }
      last = word;
      return word.length > 2;
    });
    callback(words);
  });
}}

Do.chain(
  fs.read(__filename),
  get_keywords
)(debug, show_error);

Do.chain(
  fs.readdir(__dirname),
  function (filenames) {
    return Do.filter_map(filenames, check_and_load);
  }
)(debug, show_error);