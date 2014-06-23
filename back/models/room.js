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
var Room = function(id, code, currentArtist, currentTitle){
  this.attrs = {
    id: id,
    code: code,
    currentArtist: currentArtist,
    currentTitle: currentTitle
  };
};


// Get the track ids
Room.prototype.trackIds = Q.async( function* () {

  // Raw ids
  var res = yield Redis.zrevrangebyscore( Redis.playlist(this.attrs.id), '+inf', 0 );

  return _.map(res, function(id){ return parseInt(id, 10); });

});

Room.prototype.getTopTrack = Q.async( function* () {
  var trackIds = yield this.trackIds();
  console.log('track Ids : ', trackIds);
  return trackIds[0];
});

Room.prototype.setCurrentTrack = Q.async( function* (artist, title) {

  yield Redis.hmset(Redis.room(this.attrs.id), {
    'c_artist': artist,
    'c_title': title
  });  

});


// ======= //
// GLOBALS //
// ======= //

// Find a room by id
Room.get = Q.async( function* (id) {

  // Get the code
  var attrs = yield Redis.hgetall( Redis.room(id) );

  if (!attrs) { return null; }

  return new Room(id, attrs['code'], attrs['c_artist'], attrs['c_title']);

});


// Create a new room
Room.create = Q.async( function* (code) {

  // Generate a uid before
  var id = uid();
  while ( !!(yield Room.get(id)) ) {
    id = uid();
  }

  // Create the room
  yield Redis.hmset(Redis.room(id), {
    'code': code,
    'c_artist': '',
    'c.title': ''
  });

  // Add the code in the index
  yield Redis.hset(Redis.codes(), code, id);

  // Return the room
  return new Room(id, code, '', '');

});

// Find the room matching a code
Room.findByCode = Q.async( function* (code) {

  var roomId = yield Redis.hget(Redis.codes(), code);
  if (!roomId) { return null; }

  return Room.get(roomId);

});

// export the room model
module.exports = Room;