// Handles tracks expiration

// Instance : get notifications, handles ttl
// One per room, starts at room creation, dies at room deletion

var TrackExpirer = {};


// Code here ...

TrackExpirer.addTrack = function(track){
  console.log('[TTL] Adding track', track);
};

TrackExpirer.refreshTrack = function(track){
  console.log('[TTL] Refreshing track', track);
};

module.exports = TrackExpirer;