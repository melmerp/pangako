/**
 * Created by Mark E. Pascual <melmerp@gmail.com> on 3/15/14.
 */
'use strict';

const asap = require('asap');

/**
 * Creates a deferred object which has three fields:
 * {
 *   promise: a Promise object,
 *   resolve: function(value) which resolves the promise with value
 *   reject: function(reason) which rejects the promise with reason
 * }
 * @returns {Object} the deferred object
 */
function defer() {
  var deferred = {};

  // Create a promise that doesn't have real work except to make sure the
  // deferred knows how to settle the promise.
  deferred.promise = new Promise(function(resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

const PromiseState = Object.freeze({
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
});

/**
 * Constructs a Promise object. The promise should be settled by the work
 * callback which will call either resolve or reject to settle the promise.
 * @param {function} work function(resolve, reject)
 * @constructor
 */
function Promise(work) {
  this.state = PromiseState.PENDING;

  // Array of deferreds to callback when the promise settles.
  this.subscribers = [];

  let self = this;
  let resolve = function(value) {
    resolvePromise(self, value);
  };
  let reject = function(reason) {
    rejectPromise(self, reason);
  };
  work(resolve, reject);
}

Promise.prototype = {
  constructor: Promise,

  /**
   * Registers callbacks that will get called when a promise is settled.
   * If the promise is resolved, the onFulfilled callback will get executed
   * with value as its lone argument. If a promise is rejected, the
   * onRejected callback will get executed with reason as its lone argument.
   * onFulfilled and onRejected should return either a value or a another
   * thenable.
   *
   * Returns a promise:
   *   1. If the executed callback returns a thenable, this method returns
   *      a Promise object representing that thenable.
   *   2. If the executed callback returns a value, this method returns a
   *      Promise that is resolved with the value.
   *   3. If the executed callback throws an exception, this method returns
   *      a Promise that is rejected with the exception as the reason.
   *
   * @param onFulfilled - function(value)
   * @param onRejected - function(reason)
   * @returns {Promise} promise
   */
  then: function(onFulfilled, onRejected) {
    if (this.state === PromiseState.PENDING) {

      // Create a deferred and add it to the subscribers for callback
      // when the promise is settled.
      let deferred = defer();
      this.subscribers.push({
        deferred: deferred,
        onFulfilled: onFulfilled,
        onRejected: onRejected
      });
      return deferred.promise;
    }

    // The promise is already settled, so callback if needed.
    let callback = (this.state === PromiseState.FULFILLED) ? onFulfilled : onRejected;
    if (callback && typeof(callback) === 'function') {
      // create a deferred to handle the results of the callback
      let deferred = defer();
      let valueOrReason = this.valueOrReason;
      asap(function() {
        doPromiseCallback(deferred, callback, valueOrReason);
      });
      return deferred.promise;
    }

    // The callback isn't a function, so just pass-through.
    return this;
  }
};


function resolvePromise(promise, value) {
  settlePromise(promise, PromiseState.FULFILLED, value);
}

function rejectPromise(promise, reason) {
  settlePromise(promise, PromiseState.REJECTED, reason);
}

function settlePromise(promise, state, valueOrReason) {
  if (promise.state === PromiseState.PENDING) {
    promise.state = state;
    promise.valueOrReason = valueOrReason;

    // If there are subscribers, then iterate through and perform callbacks.
    if (promise.subscribers.length > 0) {
      let subscriber;
      while (subscriber = promise.subscribers.shift()) {
        let deferred = subscriber.deferred;
        let callback = (state === PromiseState.FULFILLED) ? subscriber.onFulfilled : subscriber.onRejected;
        if (callback && typeof(callback) === 'function') {
          asap(function() {
            doPromiseCallback(deferred, callback, valueOrReason);
          });
        }
        else {
          // These are just pass-throughs so just resolve or reject appropriately.
          asap(function() {
            try {
              if (state === PromiseState.FULFILLED) {
                deferred.resolve(valueOrReason);
              }
              else {
                deferred.reject(valueOrReason);
              }
            }
            catch (err) {
              deferred.reject(err);
            }
          });
        }
      }
    }
  }
}

function doPromiseCallback(deferred, callback, valueOrReason) {
  try {
    let x = callback(valueOrReason);
    promiseResolutionProcedure(deferred, x);
  }
  catch (err) {
    deferred.reject(err);
  }
}

function promiseResolutionProcedure(deferred, x) {
  try {
    if (deferred.promise === x) {
      throw new TypeError();
    }
    if (x && (typeof(x) === 'object' || typeof(x) === 'function')) {
      // check to see if x is a thenable
      let then = x.then;
      if (then && typeof(then) === 'function') {
        // settled exists in order to make sure the call to then.call(...)
        // will result such that the first call to either onFulfilled(...)
        // or onRejected(...) will cause any further calls to
        // onFullfilled(...) or onRejected(...) being ignored
        let settled;
        try {
          then.call(x, function onFulfilled(value) {
              if (settled) return;
              settled = true;
              promiseResolutionProcedure(deferred, value);
            },
            function onRejected(reason) {
              if (settled) return;
              settled = true;
              deferred.reject(reason);
            });
        }
        catch (err) {
          if (settled) return;
          deferred.reject(err);
        }
      }
      else {
        deferred.resolve(x);
      }
    }
    else {
      deferred.resolve(x);
    }
  }
  catch (err) {
    deferred.reject(err);
  }
}

exports.defer = defer;
exports.Promise = Promise;
