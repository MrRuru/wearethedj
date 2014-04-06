// Wrapper around the redis pubsub
var redis  = require('redis');

var Pubsub = {};


// =======
// Exports
// =======
Pubsub.notifyNewUser = function(roomId, userAttrs){
  console.log('PUBSUB - notify new user', userAttrs, 'for room', roomId);
};

Pubsub.onTrackAdded = function(roomId, cb){
  // cb(trackAttrs);
};

Pubsub.onTrackUpdated = function(roomId, cb){
  // cb(trackAttrs);
};

Pubsub.onTrackRemoved = function(roomId, cb){
  // cb(trackAttrs);
};

Pubsub.onTrackPlaying = function(roomId, cb){
  // cb(trackAttrs);
};

Pubsub.onUserUpdated = function(roomId, cb){
  // cb(userAttrs);
};


module.exports = Pubsub;