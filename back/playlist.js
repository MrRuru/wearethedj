// Handles top track, adding and removing
// Bound to room
// Know tracks
var Q     = require('q'),
    _     = require('lodash'),
    Room  = require('./models/room.js'),
    Track = require('./models/track.js');

var PlaylistService = {};

var Playlist = function(room){
  this.room = room;
};

Playlist.prototype.tracks = Q.async( function* () {

  // Tracks ids
  var trackIds = yield this.room.trackIds();
  console.log('trackIds', trackIds);

  var roomId = this.room.attrs.id;

  // Map to tracks
  var serializedTracks = yield Q.all(_.map(trackIds, Q.async( function * (trackId) {

    var track = yield Track.get(roomId, trackId);

    if (!track) { 
      console.log('huh? No track found for', roomId, trackId);
      return null;
    }

    return track.attrs;

  })));

  return _.select(serializedTracks, function(track){ return (track !== null); });

});

Playlist.prototype.addTrack = Q.async( function* (trackData) {

  // Proxy to Track#create
  var track = yield Track.create(this.room.attrs.id, trackData.id, trackData.artist, trackData.title);

  // Return the track
  return track;

});

Playlist.prototype.getTrack = function(trackId) {

  return Track.get(this.room.attrs.id, trackId);

};

PlaylistService.find = Q.async( function* (roomId) {

  console.log('getting room with id', roomId);

  var room = yield Room.get(roomId);
  if (!room) { return null; }

  return new Playlist(room);

});

module.exports = PlaylistService;