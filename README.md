# pangako

A bare bones [Javascript Promises/A+ spec](https://github.com/promises-aplus/promises-spec) implementation.

This implementation passes the [Promises/A+ Compliance Test Suite](https://github.com/promises-aplus/promises-tests).

## Installation

<pre><code>npm install pangako
</code></pre>

## Usage

This example will create a deferred object which contains a promise and two
callbacks, resolve and reject, which can be called to settle the promise. A
timeout is then set to resolve the promise after 10 seconds. `then` is called
on the promise to set a callback which will execute when the promise is
fulfilled.

### Using pangako.defer

<pre><code>const pangako = require('pangako');

// create a deferred and set a timeout to resolve the deferred
var deferred = pangako.defer();
setTimeout(function() {
  deferred.resolve("I'm now resolved!");
}, 10000);

// waits for the promise to get resolved and then prints the value
deferred.promise.then(function(value) {
  console.log(value);
});
</code></pre>

### Using pangako.Promise

<pre><code>const Promise = require('pangako').Promise;

// construct a new Promise and does some work and resolves itself
var promise = new Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve("I'm now resolved!");
  }, 10000);
});

promise.then(function(value) {
  console.log(value);
});
</code></pre>

## Testing - Running the compliance test suite

To test the installation, run:

Run:
<pre><code>npm test
</code></pre>

Results should be:
<pre><code>...
  872 passing (13s)
</code></pre>
