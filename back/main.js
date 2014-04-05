// Configuration
var appPort     = 14001
  , socketPort  = 3457;


// Web apps
var express       = require('express')
  , app           = express()
  , server        = require('http').createServer(app)
  , socketServer  = require('http').createServer()
  , io            = require('socket.io').listen(socketServer)
  , Rooms         = require('./lib/rooms.js')


// Launch apps
// Separate port for sockets for 3G compatibility
server.listen(appPort);
console.log('App listening on port : ' + appPort);

socketServer.listen(socketPort);
console.log('Sockets listening on port : ' + socketPort);


// Static files middleware
app.use(express.static(__dirname + '/front'));


// Pop top track API endpoint
app.delete('/room/:roomId/top', function(req, res){
  var room = Rooms.get(req.params.roomId);

  room.popTopTrack().then(function(trackId){
    console.log('popped top track. response is', trackId);
    res.send(trackId);
  }).done();
});



io.sockets.on('connection', function(socket){

  console.log('socket connected!');

  // No user id nor room id for now
  var socketUserId = null;
  var socketRoomId = null;

  // Actual connection
  socket.on('bootstrap', function(data){

    console.log('APP - connecting', data.userId, 'to room', data.roomId);

    // Store the user/room matching the socket
    socketUserId = data.userId;
    socketRoomId = data.roomId;

    // Get the current room
    var room = Rooms.get(socketRoomId);

    // Bind the socket as a new user
    // Handles bootstraping, and update events
    room.connect(socketUserId, socket);

  });

  // Disconnection
  socket.on('disconnect', function(){

    // Clear the user if defined
    if(socketRoomId && socketUserId) {
      console.log('APP - disconnecting', socketUserId, 'from room', socketRoomId);
      Rooms.get(socketRoomId).disconnect(socketUserId, socket);
    }

  });

});