/**
 *  * Created by mpascual on 3/14/14.
 *   */
'use strict';

const pangako = require('../pangako');
const tests = require('promises-aplus-tests');

let adapter = pangako;
adapter.deferred = pangako.defer;

tests(adapter, function(err) {
  console.log(err);
});

/*
let dummy = { dummy: "dummy" };
let sentinel = { sentinel: "sentinel" };

let deferred = pangako.defer();
let promise1 = deferred.promise;
promise1.resolve(10);

promise1.then(function(value) {
  console.log(value);
  return 20;
}, function(reason) {
  console.log(reason);
})
.then(function(value) {
  console.log(value);
}, function(reason) {
  console.log(reason);
});
*/
