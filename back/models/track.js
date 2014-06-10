// The track model
// Handles logic and persistence for a single track
var Q     = require('q'),
    Redis = require('../adapters/redis');


// ======== //
// INSTANCE //
// ======== //


// The initializer
// Not called explicitely, only by
// - the finder `Track.get`
// - the builder `Track.create`
// The attrs are
// - id             
// - roomId         
// - score          
// - status         
// - artist         
// - title          
// - created_at     
// - last_upvote_at 
var Track = function(attrs) {
  this.attrs = {
    id             : parseInt(attrs.id, 10),
    roomId         : attrs.roomId,
    score          : parseInt(attrs.score || 0, 10),
    status         : attrs.status,
    artist         : attrs.artist,
    title          : attrs.title,
    created_at     : parseInt(attrs.created_at, 10),
    last_upvote_at : parseInt(attrs.last_upvote_at, 10)
  };
};


// Destroys the track
// Returns nothing
Track.prototype.destroy = Q.async( function* () {

  // Remove it from the playlist
  yield Redis.zrem( Redis.playlist(this.roomId), this.id );

  // Clear its attributes
  yield Redis.del( Redis.track(this.roomId, this.id) );

});


// Update its status
// Returns nothing
Track.prototype.setAttr = Q.async( function* (attr, value) {

  yield Redis.hset( Redis.track(this.attrs.roomId, this.attrs.id), attr, value );
  this[attrs] = value;

});


// Upvote
Track.prototype.upvote = Q.async( function* () {

  var upvoteBy = (this.attrs.status === 'new') ? 2 : 1;
  var newScore = yield Redis.zincrby( Redis.playlist(this.attrs.roomId), upvoteBy, this.attrs.id );
  this.attrs.score = parseInt(newScore, 10);

});


// Downvote
Track.prototype.downvote = Q.async( function* () {

  var newScore = yield Redis.zincrby( Redis.playlist(this.attrs.roomId), -1, this.attrs.id );
  this.attrs.score = parseInt(newScore, 10);

  // TODO : destroy if less than 0
  if (this.attrs.score <= 0) {
    yield this.destroy();
  }

  return this;

});

// ======= //
// GLOBALS //
// ======= //


// Find a track given a roomId and trackId
// Initialize it with the redis data
// Return a promise for the track
Track.get = Q.async( function* (roomId, trackId) {

  var score = yield Redis.zscore( Redis.playlist(roomId), trackId );
  var attrs = yield Redis.hgetall( Redis.track(roomId, trackId) );

  if (!score || !attrs) { return null; }

  return new Track({
    id: trackId,
    roomId: roomId,
    score: score,
    status: attrs.status,
    artist: attrs.artist,
    title: attrs.title,
    created_at: attrs.created_at,
    last_upvote_at: attrs.last_upvote_at
  });

});


// Create a new track with the given parameters
// Return a promise for *false* (not created, already existing) or the new track
Track.create = Q.async( function* (roomId, trackId, artist, title) {

  // Already existing : cancel
  var existing = yield Track.get(roomId, trackId);
  if (!!existing) { return false; }

  // Build the attrs
  var trackAttrs = {
    title: title,
    artist: artist,
    created_at: Date.now(),
    last_upvote_at: Date.now(),
    status: 'new'
  };

  // Store them in redis
  yield Redis.hmset(Redis.track(roomId, trackId), trackAttrs);

  // Update the score (1 if not existing)
  yield Redis.zadd(Redis.playlist(roomId), 1, trackId);

  // Return the new track
  return Track.get(roomId, trackId);

});



// Export the class
module.exports = Track;
