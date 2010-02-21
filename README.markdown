# `Do` it!

`Do` is a library that adds higher level abstraction to continuables.  What I mean by a continuable is the following:

## Continuables

    function divide(a, b) { return function (callback, errback) {
      // the timeout it to prove that we're working asynchronously
      setTimeout(function () {
        if (b === 0) {
          errback(new Error("Cannot divide by 0"));
        } else {
          callback(a / b);
        }
      }); 
    }}

A continuable is a function that returns a curried version of itself instead of a result directly.  The last two arguments are the callback and the errback.  So a continuable won't execute until you attach callbacks to it:

    divide(100, 10)(function (result) {
      puts("the result is " + result);
    }, function (error) {
      throw error;
    });

This style is extremely simple (doesn't require an external library like process.Promise to use), and is fairly powerful.

 - The initial function can have variable arguments.
 - The continuable itself is portable until it's invoked by attaching callbacks.

## Higher-level operations

The `Do` library makes doing higher-level abstractions easy.  All of these helpers are themselves continuables so you can attach callbacks by calling the returned, curried function.

### Do.parallel(actions) {...}

Takes an array of actions and runs them all in parallel. You can either pass in an array of actions, or several actions as function arguments.

 - If you pass in an array, then the output will be an array of all the results
 - If you pass in separate arguments, then the output will have several arguments.
 
**Example:**

    // Multiple arguments
    Do.parallel(
      Do.read("/etc/passwd"),
      Do.read(__filename)
    )(function (passwd, self) {
      // Do something
    }, error_handler);

    // Single argument
    var actions = [
      Do.read("/etc/passwd"),
      Do.read("__filename")
    ];
    Do.parallel(actions)(function (results) {
      // Do something
    }, error_handler);
 
### Do.chain(actions) {...}

Chains together several actions feeding the output of the first to the input of the second and the final output to the continuables callback.

**Example:**

    // Multiple arguments
    Do.chain(
      Do.read(__filename),
      function (text) { 
        return Do.save("newfile", text);
      },
      function () {
        return Do.stat("newfile");
      }
    )(function (stat) {
      // Do something
    }, error_handler);

    // Single argument
    var actions = [
      Do.read(__filename),
      function (text) { 
        return Do.save("newfile", text);
      },
      function () {
        return Do.stat("newfile");
      }
    ];
    Do.chain(actions)(function (stat) {
      // Do something
    }, error_handler);

### Do.map(array, fn) {...}

Takes an array and does an array map over it using the async callback `fn`. The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function load_file(filename, callback, errback) {
      fs.read(filename)(function (data) {
        callback([filename, data]);
      }, errback);
    }
    Do.map(files, load_file)(function (contents) {
      // Do something
    }, error_handler);
    
    // continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    Do.map(files, fs.read)(function (contents) {
      // Do something
    }, error_handler);

### Do.filter(array, fn) {...}

Takes an array and does an array filter over it using the async callback `fn`. The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function is_file(filename, callback, errback) {
      fs.stat(filename)(function (stat) {
        callback(stat.isFile());
      }, errback);
    }
    Do.filter(files, is_file)(function (filtered_files) {
      // Do something
    }, error_handler);

    // Continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function is_file(filename) { return function (callback, errback) {
      fs.stat(filename)(function (stat) {
        callback(stat.isFile());
      }, errback);
    }}
    Do.filter(files, is_file)(function (filtered_files) {
      // Do something
    }, error_handler);

### Do.filter_map(array, fn) {...}

Takes an array and does a combined filter and map over it.  If the result
of an item is undefined, then it's filtered out, otherwise it's mapped in.
The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function check_and_load(filename, callback, errback) {
      fs.stat(filename)(function (stat) {
        if (stat.isFile()) {
          load_file(filename, callback, errback);
        } else {
          callback();
        }
      }, errback);
    }
    Do.filter_map(files, check_and_load)(function (filtered_files_with_data) {
      // Do something
    }, error_handler);

    // Continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function check_and_load(filename) { return function (callback, errback) {
      fs.stat(filename)(function (stat) {
        if (stat.isFile()) {
          load_file(filename, callback, errback);
        } else {
          callback();
        }
      }, errback);
    }}
    Do.filter_map(files, check_and_load)(function (filtered_files_with_data) {
      // Do something
    }, error_handler);

## Using with node libraries

Do has a super nifty `Do.convert` function that takes a library and converts it to use Do style continuables.  For example, if you wanted to use `fs.fileRead` and `fs.fileWrite`, then you would do this:

    var fs = Do.convert(require('fs'), ['readFile', 'writeFile']);

Do will give you a copy of `fs` that has `readFile` and `writeFile` converted to Do style.  It's that easy!

### For library writers

All async functions in node follow a common interface:

    method(arg1, arg2, arg3, ..., callback)

Where `callback` is of the form:

    callback(err, result1, result2, ...)

This is done to keep node simple and to allow for interoperability between the various async abstractions like Do continuables and CommonJS promises.

If you're writing a library, make sure to export all your async functions following the node interface.  Then anyone using your library can know what format to expect.

## Future TODOs

 - Make some sort of helper that makes it easy to call any function regardless of it's sync or async status.  This is tricky vs. promises since our return value is just a regular function, not an instance of something.
