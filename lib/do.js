// Takes an array of actions and runs them all in parallel.
// You can either pass in an array of actions, or several actions
// as function arguments.
// If you pass in an array, then the output will be an array of all the results
// If you pass in separate arguments, then the output will have several arguments.
exports.parallel = function parallel(actions) {
  if (!(actions instanceof Array)) {
    actions = Array.prototype.slice.call(arguments);
    var direct = true;
  }
  return function(callback, errback) {
    var results = [],
        counter = actions.length;
    actions.forEach(function (action, i) {
      action(function (result) {
        results[i] = result;
        counter--;
        if (counter <= 0) {
          if (direct) {
            callback.apply(null, results);
          } else {
            callback.call(null, results);
          }
        }
      }, errback);
    });
  }
};

// Chains together several actions feeding the output of the first to the
// input of the second and the final output to the callback
exports.chain = function chain(actions) {
  if (!(actions instanceof Array)) {
    actions = Array.prototype.slice.call(arguments);
  }
  return function(callback, errback) {
    var pos = 0;
    var length = actions.length;
    function loop(result) {
      pos++;
      if (pos >= length) {
        callback(result);
      } else {
        actions[pos](result)(loop, errback);
      }
    }
    actions[pos](loop, errback);
  }
}

// Takes an array and does an array map over it using the async callback `fn`
// The signature of `fn` is `function fn(item, callback, errback)`
exports.map = function map(array, fn) { return function (callback, errback) {
  var counter = array.length;
  var new_array = [];
  array.forEach(function (item, index) {
    var local_callback = function (result) {
      new_array[index] = result;
      counter--;
      if (counter <= 0) {
        new_array.length = array.length
        callback(new_array);
      }
    };
    var cont = fn(item, local_callback, errback);
    if (typeof cont === 'function') {
      cont(local_callback, errback);
    }
  });
}}

// Takes an array and does an array filter over it using the async callback `fn`
// The signature of `fn` is `function fn(item, callback, errback)`
exports.filter = function filter(array, fn) { return function (callback, errback) {
  var counter = array.length;
  var valid = {};
  array.forEach(function (item, index) {
    var local_callback = function (result) {
      valid[index] = result;
      counter--;
      if (counter <= 0) {
        var result = [];
        array.forEach(function (item, index) {
          if (valid[index]) {
            result.push(item);
          }
        });
        callback(result);
      }
    };
    var cont = fn(item, local_callback, errback);
    if (typeof cont === 'function') {
      cont(local_callback, errback);
    }
  });
}}

// Takes an array and does a combined filter and map over it.  If the result
// of an item is undefined, then it's filtered out, otherwise it's mapped in.
// The signature of `fn` is `function fn(item, callback, errback)`
exports.filterMap = function filterMap(array, fn) { return function (callback, errback) {
  var counter = array.length;
  var new_array = [];
  array.forEach(function (item, index) {
    var local_callback = function (result) {
      new_array[index] = result;
      counter--;
      if (counter <= 0) {
        new_array.length = array.length;
        callback(new_array.filter(function (item) {
          return typeof item !== 'undefined';
        }));
      }
    };
    var cont = fn(item, local_callback, errback);
    if (typeof cont === 'function') {
      cont(local_callback, errback);
    }
  });
}};

// Allows to group several callbacks.
exports.combo = function combo(callback) {
  var items = 0,
      results = [];
  function add() {
    var id = items;
    items++;
    return function () {
      check(id, arguments);
    };
  }
  function check(id, arguments) {
    results[id] = Array.prototype.slice.call(arguments);
    items--;
    if (items == 0) {
      callback.apply(this, results);
    }
  }
  return { add: add, check: check };
}


// Takes any async lib that uses callback based signatures and converts
// the specified names to continuable style and returns the new library.
exports.convert = function (lib, names) {
  var newlib = {};
  Object.keys(lib).forEach(function (key) {
    if (names.indexOf(key) < 0) {
      return newlib[key] = lib[key];
    }
    newlib[key] = function () {
      var args = Array.prototype.slice.call(arguments);
      return function (callback, errback) {
        args.push(function (err, val) {
          if (err) {
            errback(err);
          } else {
            callback(val);
          }
        });
        lib[key].apply(lib, args)
      }
    }
  });
  return newlib;
}

