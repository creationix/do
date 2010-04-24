// This file is just a mess of examples of how to use the library.

var Do = require('./lib/do');
var fs = Do.convert(require('fs'), ["readFile", "stat", "readdir"]);
var http = Do.convert(require('http'), ['cat']);
var sys = require('sys');

function debug(message, showHidden) {
  sys.error(sys.inspect(message, showHidden));
}
function showError(trace) {
  sys.error("ERROR: " + sys.inspect(trace));
}

// A very slow error to make sure that no success message is emitted if there
// is an error anywhere.
function slow_error() { return function (callback, errback) {
  setTimeout(function () {
    errback(new Error("Yikes!"));
  }, 500);
}}

Do.parallel(
  fs.readFile(__filename),
  slow_error()
)(function (bad, good) {
  sys.puts("Good: " + sys.inspect(arguments));
}, showError);

Do.parallel(
  fs.readFile(__filename)
)(function (bad, good) {
  sys.puts("Good: " + sys.inspect(arguments));
}, showError);

Do.parallel(
  Do.parallel([
    fs.readFile(__filename),
    fs.readFile(__filename)
  ]),
  fs.readFile(__filename)
)(function () {
  sys.puts("Good: " + sys.inspect(arguments));
}, showError);

// Filter callback that only let's files through by using stat
function only_files(filename, callback, errback) {
  fs.stat(filename)(function (stat) {
    callback(stat.isFile());
  }, errback);
}

// Filter that replaces a filename with the pair of filename and content
function marked_read(filename, callback, errback) {
  fs.readFile(filename)(function (data) {
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
loaddir(__dirname)(debug, showError);

function fast_loaddir(path) { return function (callback, errback) {
  fs.readdir(path)(function (filenames) {
    Do.filterMap(filenames, check_and_load)(callback, errback);
  }, errback);
}}
fast_loaddir(__dirname)(debug, showError);

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
  fs.readFile(__filename),
  get_keywords
)(debug, showError);

Do.chain(
  fs.readdir(__dirname),
  function (filenames) {
    return Do.filterMap(filenames, check_and_load);
  }
)(debug, showError);

// Use the new continuable style map
var files = ["test.js", "README.markdown"];
Do.map(files, fs.readFile)(debug, showError);

function safe_load(filename) { return function (callback, errback) {
  fs.stat(filename)(function (stat) {
    if (stat.isFile()) {
      fs.readFile(filename)(callback, errback)
    } else {
      callback();
    }
  }, errback);
}}

// Use filterMap with new continuable based filter
fs.readdir(__dirname)(function (list) {
  Do.filterMap(list, safe_load)(debug, showError);
}, showError);
