# `Do` it!

`Do` is a library that adds higher level abstraction and continuables.  What I mean by a continuable is explained by the following:

### Continuables

    function divide(a, b) { return function (callback, errback) {
      // Use nextTick to prove that we're working asynchronously
      process.nextTick(function () {
        if (b === 0) {
          errback(new Error("Cannot divide by 0"));
        } else {
          callback(a / b);
        }
      });
    }}

`Do` expects async functions to not require the callback in the initial invocation, but instead return a continuable which can then be called with the `callback` and `errback`.  This is done by manually currying the function. The "continuable" is the partially applied version of the function returned by the outer function.  The body of the function won't be executed until you finish the application by attaching a callback.

    divide(100, 10)(function (result) {
      puts("the result is " + result);
    }, function (error) {
      throw error;
    });

This style is extremely simple (doesn't require an external library like promises to use), and is fairly powerful.

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
    }, errorHandler);

    // Single argument
    var actions = [
      Do.read("/etc/passwd"),
      Do.read("__filename")
    ];
    Do.parallel(actions)(function (results) {
      // Do something
    }, errorHandler);
 
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
    }, errorHandler);

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
    }, errorHandler);

### Do.map(array, fn) {...}

Takes an array and does an array map over it using the async callback `fn`. The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function loadFile(filename, callback, errback) {
      fs.read(filename)(function (data) {
        callback([filename, data]);
      }, errback);
    }
    Do.map(files, loadFile)(function (contents) {
      // Do something
    }, errorHandler);
    
    // continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    Do.map(files, fs.read)(function (contents) {
      // Do something
    }, errorHandler);

### Do.filter(array, fn) {...}

Takes an array and does an array filter over it using the async callback `fn`. The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function isFile(filename, callback, errback) {
      fs.stat(filename)(function (stat) {
        callback(stat.isFile());
      }, errback);
    }
    Do.filter(files, isFile)(function (filtered_files) {
      // Do something
    }, errorHandler);

    // Continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function isFile(filename) { return function (callback, errback) {
      fs.stat(filename)(function (stat) {
        callback(stat.isFile());
      }, errback);
    }}
    Do.filter(files, isFile)(function (filtered_files) {
      // Do something
    }, errorHandler);

### Do.filterMap(array, fn) {...}

Takes an array and does a combined filter and map over it.  If the result
of an item is undefined, then it's filtered out, otherwise it's mapped in.
The signature of `fn` is `function fn(item, callback, errback)` or any regular continuable.

**Example:**

    // Direct callback filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function check_and_load(filename, callback, errback) {
      fs.stat(filename)(function (stat) {
        if (stat.isFile()) {
          loadFile(filename, callback, errback);
        } else {
          callback();
        }
      }, errback);
    }
    Do.filterMap(files, check_and_load)(function (filtered_files_with_data) {
      // Do something
    }, errorHandler);

    // Continuable based filter
    var files = ['users.json', 'pages.json', 'products.json'];
    function check_and_load(filename) { return function (callback, errback) {
      fs.stat(filename)(function (stat) {
        if (stat.isFile()) {
          loadFile(filename, callback, errback);
        } else {
          callback();
        }
      }, errback);
    }}
    Do.filterMap(files, check_and_load)(function (filtered_files_with_data) {
      // Do something
    }, errorHandler);

## Using with node libraries

Do has a super nifty `Do.convert` function that takes a library and converts it to use Do style continuables.  For example, if you wanted to use `fs.readFile` and `fs.writeFile`, then you would do this:

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

## License

Do is [licensed][] under the [MIT license][].

[MIT license]: http://creativecommons.org/licenses/MIT/
