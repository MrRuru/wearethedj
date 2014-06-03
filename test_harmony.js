var Q = require('q');

var testPromiseOk = function(){
  var deferred = Q.defer();

  console.log('[promiseOK] calling aync method...');
  setTimeout(function(){
    console.log('[promiseOK] async method OK');
    deferred.resolve('OK');
  });

  return deferred.promise;
};

var testPromiseKo = function(){
  var deferred = Q.defer();

  console.log('[promiseKO] calling aync method...');
  setTimeout(function(){
    console.log('[promiseKO] async method KO');
    deferred.reject('KO');
  });

  return deferred.promise;
};


// console.log('### Standard promises ###');

// console.log('calling promise OK...');
// testPromiseOk()
// .then(function(res){
//   console.log('promise OK result is', res);
//   return testPromiseKo();
// })
// .then(function(res){
//   console.log('promise KO result is', res);
// })
// .fail(function(reason){
//   console.log('there was a failure : ', reason);
// });

Track = {};

Track.get = Q.async( function* (id) {

  var res = yield testPromiseOk();

  return {
    id: id,
    res: res
  };

});


// Track.get(3).then(function(track){
//   console.log('Got Track', track);
// });


// Q.spawn(function* (){

//   var track = yield Track.get(4);
//   console.log('got track', track);

// });

var TestClass = function(){};

TestClass.prototype.foo = Q.async( function* (){
  console.log('in Test#foo');
  return yield Track.get(4);
});

var test = new TestClass();
res = test.foo();

res.then(function(out){
  console.log('and the final is', out);
});

// console.log('### Generators & promises ###');

// var res = Q.async(function* (){

//   var res = yield testPromiseOk();
//   console.log('promise OK results is', res);

//   try {
//     res = yield testPromiseKo();
//     console.log('promise KO result is', res);
//   }
//   catch (e) {
//     console.log('[ERROR]', e);
//   }

//   return 'coucou';

// });


// console.log('res is', res());

// res().then(function(out){
//   console.log('out is ', out);
// });

