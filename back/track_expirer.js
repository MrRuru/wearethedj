// Handles tracks expiration
var Q       = require('q'),
    Track   = require('./models/track.js'),
    Sockets = require('./sockets.js');


var TrackExpirer = {};

var NEW_DURATION   = 180 * 1000;  // 3 minutes
var ALIVE_DURATION = 900 * 1000;  // 15 minutes
var DYING_TICK     = 1   * 1000;  // 10 second

// Should be initialized with all tracks, but fuck it
var _trackTimeouts = {};

var getTrackKey = function(track){
  return '' + track.attrs.roomId + ':' + track.attrs.id;
}

// Check the status a track is supposed to have
var checkStatus = function(track){
  if (track.attrs.created_at > Date.now() - NEW_DURATION) {
    return 'new';
  }

  else {
    if (track.attrs.last_upvote_at > Date.now() - ALIVE_DURATION) {
      return 'normal';
    }
    else {
      return 'dying';
    }
  }
}


var enqueueCheck = function(track) {

  var delay;

  // New? Enqueue check when normal
  if (track.attrs.status === 'new') {
    delay = track.attrs.created_at + NEW_DURATION - Date.now();
  }

  // Normal? Enqueue check when dying
  if (track.attrs.status === 'normal') {
    delay = track.attrs.last_upvote_at + ALIVE_DURATION - Date.now();
  }

  // Dying? Enqueue check for last tick
  if (track.attrs.status === 'dying') {
    delay = DYING_TICK;
  }

  if (delay < 0) { delay = 0; }

  console.log('[TTL] Next check in', delay);

  // Clear existing timeout if any
  var key = getTrackKey(track);
  clearTimeout(_trackTimeouts[key]);
  _trackTimeouts[key] = setTimeout(function(){ check(track.attrs.roomId, track.attrs.id).done(); }, delay);

};


var check = Q.async( function* (roomId, trackId) {

  var track = yield Track.get(roomId, trackId);

  var trackStatus = track.attrs.status;
  var supposedStatus = checkStatus(track);

  console.log('checking', supposedStatus, track);

  // Status mismatch
  if (trackStatus !==  supposedStatus) {
    console.log('status mismatch : ', trackStatus, supposedStatus);

    yield track.setAttr('status', supposedStatus);
    Sockets.broadcastRoom(track.attrs.roomId, 'updateTrack', track.attrs);
    enqueueCheck(track);
    return;
  }

  // No mismatch and dying : hit
  if (trackStatus === 'dying') {
    console.log('dying!');


    yield track.downvote();

    if (!track.deleted) {
      Sockets.broadcastRoom(track.attrs.roomId, 'updateTrack', track.attrs);
      enqueueCheck(track);
    }
    else {
      Sockets.broadcastRoom(track.attrs.roomId, 'deleteTrack', track.attrs);
    }

    return;
  }

  // Otherwise, just re-enqueue check...
  enqueueCheck(track);

});


TrackExpirer.addTrack = function(track){
  console.log('[TTL] Adding track', track);
  check(track.attrs.roomId, track.attrs.id).done();
};

TrackExpirer.refreshTrack = function(track){
  console.log('[TTL] Refreshing track', track);
  check(track.attrs.roomId, track.attrs.id).done();
};

TrackExpirer.deleteTrack = function(track){
  console.log('[TTL] Deleting track', track);  
  var key = getTrackKey(track);
  clearTimeout(_trackTimeouts[key]);
};

module.exports = TrackExpirer;