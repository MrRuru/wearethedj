// The track model
// Handles logic and persistence for a single track
var Q     = require('q'),
    redis = require('../adapters/redis');


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
var Track = function() {
  public id             = parseInt(attrs.id, 10);
  public roomId         = parseInt(attrs.roomId);
  public score          = parseInt(attrs.score || 0, 10);
  public status         = attrs.status;
  public artist         = attrs.artist;
  public title          = attrs.title;
  public created_at     = parseInt(attrs.created_at, 10);
  public last_upvote_at = parseInt(attrs.last_upvote_at, 10);
};


// Upvote the track by one
// Returns nothing
Track.prototype.upvote = Q.async( function* () {
  return yield Redis.zincr(Redis.playlist(this.roomId), this.id);
});


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
Track.prototype.setStatus = Q.async( function* (status) {

  yield Redis.hset( Redis.track(this.roomId, this.id), 'status', status );
  this.status = status;

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
  var existing = yield Track.get(attrs.roomId, attrs.id);
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
