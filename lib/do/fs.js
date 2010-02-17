var fs = require('fs');
// Thin wrapper around the fs module to make it work as continuables
["close","open","read","write","rename","truncate","rmdir","mkdir","sendfile",
"readdir","stat","unlink","writeFile","readFile"].forEach(function (key) {
  exports[key] = function () {
    var args = arguments;
    return function (callback, errback) {
      fs[key].apply(fs, args).addCallback(callback).addErrback(errback);
    }
  }
});
