// Handles users connected to a room, and how to dispatch messages received / sent

// ! Track.create changed signature (false || track) instead of [false||true, attrs||null]

var  Q             = require('q')
   , socketServer  = require('http').createServer()
   , io            = require('socket.io').listen(socketServer)
   , Sockets       = require('./sockets.js')
   , Playlist      = require('./playlist.js')
   , TrackExpirer  = require('./track_expirer.js');


// The calls
Sockets.on('addTrack', function(context, data, cb) { // context = getters for room / user of socket + broadcasters

  Q.spawn(function * () {

    try {
      var playlist = yield context.getPlaylist();
      var track = yield playlist.addTrack(data);

      if (!track) { 
        console.log('track already present');
        cb(false, 'track already present');
        return;
      }

      yield TrackExpirer.addTrack(track);

      Sockets.broadcastRoom(playlist.room.attrs.id, 'newTrack', track.attrs);
      cb(true);
    }
    catch (e) {
      console.log('Error adding track', context, data, e);
      cb(false, e);
    }

  });

});


Sockets.on('upvote', function(context, data, cb) {

  Q.spawn(function * () {

    try {
      var trackId = data.trackId;

      var playlist = yield context.getPlaylist();
      var track = yield playlist.getTrack(trackId);
      if (!track) { cb(false); return; }

      yield track.upvote();
      yield TrackExpirer.refreshTrack(track);

      cb(true);
      Sockets.broadcastRoom(playlist.room.attrs.id, 'updateTrack', track.attrs);
    }
    catch (e) {
      console.log('Error upvoting track', context, data, e);
      cb(false, e);
    }

  });

});




// Binding s the sockets
io.sockets.on('connection', function(socket){

  socket.on('joinRoom', function(data){
    Q.spawn( function* () {

      if (!data.userId || !data.roomId) {
        throw('Cannot bootstrap without a user and a room. userId is ' + data.userId + ' roomId is ' + data.roomId);
      }

      socket.userId = data.userId;
      socket.roomId = data.roomId;

      Sockets.register(socket);

      // Respond with the playlist
      var playlist = yield Playlist.find(data.roomId);

      if (!playlist) {
        socket.emit('boostrap', {'error': 'NoRoom'});
        return;
      }

      var tracks = yield playlist.tracks();
      socket.emit('bootstrap', {tracks: tracks, playing: playlist.getCurrentTrack()});

    });
  });

  socket.on('disconnect', function(){
    Sockets.unregister(socket);
  });

});


module.exports = socketServer;