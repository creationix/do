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
    })

Since this style is extremely simple (doesn't require an external library like process.Promise to use), and fairly powerful.  The initial function can have variable arguments and the continuable itself is portable until it's invoked by attacking callbacks.

## Higher order operations

The `Do` library makes doing higher-level abstractions easy.  All of these helpers are themselves continuables so you can attach callbacks by calling the returned curried function.

### Do.parallel

    exports.parallel = function parallel(actions) {...}

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
    }, error_handler)

    // Single argument
    var actions = [
      Do.read("/etc/passwd"),
      Do.read("__filename")
    ];
    Do.parallel(actions)(function (results) {
      // Do something
    }, error_handler)
 
### Do.chain

    exports.chain = function chain(actions) {...}
  
Chains together several actions feeding the output of the first to the input of the second and the final output to the continuables callback.

**Example:**

    // Multiple arguments
    Do.chain(
      Do.read(__filename)),
      function (text) { 
        return Do.save("newfile", text)
      },
      function () {
        return Do.stat("newfile")
      }
    )(function (stat) {
      // Do something
    }, errback)

    // Single argument
    var actions = [
      Do.read(__filename)),
      function (text) { 
        return Do.save("newfile", text)
      },
      function () {
        return Do.stat("newfile")
      }
    ];
    Do.chain(actions)(function (stat) {
      // Do something
    }, errback)
      