// The room model
// Handles playlist and signin logic, and persistence
var Q     = require('q'),
    redis = require('../adapters/redis'),
    _     = require('lodash');


// ======== //
// INSTANCE //
// ======== //


// Initializer
// Only called at creation and when fetching via id
// The id and code are the same thing BTW
var Room = function(id){
  this.id = attrs.id;
};


// Get the track ids
Room.protype.trackIds = Q.async( function* () {

  // Raw ids
  var res = yield Redis.zrevrangebyscore( Redis.playlist(this.id), '+inf', 0 );

  return _.map(res, function(id){ parseInt(id, 10); });

});



// ======= //
// GLOBALS //
// ======= //

// Find a room by id
Room.get = Q.async( function* (id) {

  var exists = yield Redis.has( Redis.playlist(id) );
  if (!exists) { return null; }

  return new Room(id);

});


// Create a new room
Room.create = Q.async( function* (id) {

  // Nothing much to do actually...
  return new Room(id);

});


// export the room model
module.exports = Room;