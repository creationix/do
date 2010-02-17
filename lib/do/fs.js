var File = require('file'),
    Posix = require('posix');

// Thin wrapper around File.read and File.write to be continuable style.
exports.read = function read(filename) { return function (callback, errback) {
  File.read(filename).addCallback(callback).addErrback(errback);
}}
exports.write = function write(filename) { return function (callback, errback) {
  File.write(filename).addCallback(callback).addErrback(errback);
}}

// Also thin wrapper around posix.readdir and posix.stat
exports.readdir =  function readdir(path) { return function (callback, errback) {
  Posix.readdir(path).addCallback(callback).addErrback(errback);
}}
exports.stat = function stat(filename) { return function (callback, errback) {
  Posix.stat(filename).addCallback(callback).addErrback(errback);
}}

// More wrappers to come...