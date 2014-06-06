// Handles users connected to a room, and how to dispatch messages received / sent

// ! Track.create changed signature (false || track) instead of [false||true, attrs||null]

var  Q             = require('q')
   , socketServer  = require('http').createServer()
   , io            = require('socket.io').listen(socketServer)
   , Sockets       = require('./sockets.js');


// The calls
Sockets.on('addTrack', Q.apply( function* (context, data) { // context = getters for room / user of socket + broadcasters

  var playlist = yield context.getPlaylist();
  var track = yield playlist.addTrack(data);

  // Track TTL : to notify

  context.broadcast('newTrack', track);

}));


Sockets.on('upvote', Q.apply( function* (context, data) {

  var playlist = yield context.getPlaylist();
  
  // Track TTL : to notify

  // ... TODO  

}));




// Binding s the sockets
io.sockets.on('connection', function(){

  socket.on('bootstrap', function(data){

    Sockets.register({
      user: data.userId,
      room: data.roomId,
      socket: socket
    });

  });

  socket.on('disconnect', function(){

    Sockets.unregister({
      socket: socket
    });

  });

});


module.exports = socketServer;