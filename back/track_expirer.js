// Handles tracks expiration
var Q       = require('q'),
    Track   = require('./models/track.js'),
    Sockets = require('./sockets.js');


var TrackExpirer = {};

var NEW_DURATION = 180;   // 3 minutes
var ALIVE_DURATION = 900; // 15 minutes


// Should be initialized with all tracks, but fuck it
var _trackTimeouts = {};


// TODO 
// - handle deletion if score 0 (and notifications)
// - handle status update


TrackExpirer.addTrack = function(track){
  console.log('[TTL] Adding track', track);
};

TrackExpirer.refreshTrack = function(track){
  console.log('[TTL] Refreshing track', track);
};

TrackExpirer.deleteTrack = function(track){
  console.log('[TTL] Deleting track', track);  
};

module.exports = TrackExpirer;