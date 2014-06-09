// The room model
// Handles playlist and signin logic, and persistence
var Q     = require('q'),
    Redis = require('../adapters/redis'),
    _     = require('lodash'),
    uid   = require('../uid.js');


// ======== //
// INSTANCE //
// ======== //


// Initializer
// Only called at creation and when fetching via id
// The id and code are the same thing BTW
var Room = function(id, code){
  this.attrs = {
    id: id,
    code: code
  };
};


// Get the track ids
Room.prototype.trackIds = Q.async( function* () {

  // Raw ids
  var res = yield Redis.zrevrangebyscore( Redis.playlist(this.attrs.id), '+inf', 0 );

  return _.map(res, function(id){ return parseInt(id, 10); });

});



// ======= //
// GLOBALS //
// ======= //

// Find a room by id
Room.get = Q.async( function* (id) {

  // Get the code
  var code = yield Redis.hget( Redis.room(id), 'code');

  if (!code) { return null; }

  return new Room(id, code);

});


// Create a new room
Room.create = Q.async( function* (code) {

  // Generate a uid before
  var id = uid();
  while ( !!(yield Room.get(id)) ) {
    id = uid();
  }

  // Create the room
  yield Redis.hset(Redis.room(id), 'code', code);

  // Add the code in the index
  yield Redis.hset(Redis.codes(), code, id);

  // Return the room
  return new Room(id, code);

});

// Find the room matching a code
Room.findByCode = Q.async( function* (code) {

  var roomId = yield Redis.hget(Redis.codes(), code);
  if (!roomId) { return null; }

  return Room.get(roomId);

});

// export the room model
module.exports = Room;