// Configuration
var appPort     = 14001
  , socketPort  = 3457;


// Web apps
var express       = require('express')
  , app           = express()
  , server        = require('http').createServer(app)
  , socketServer  = require('http').createServer()
  , io            = require('socket.io').listen(socketServer)
  , Sockets       = require('./lib/sockets.js')


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
  var roomId = req.params.roomId;
  var room = Room.find(roomId);

  room.popTopTrack().then(function(track){
    res.send(track.id);
  },
  function(err){
    res.send(500, err);
  });
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

    // Connect the socket (create the user and everything)
    Sockets.connect(socketRoomId, socketUserId, socket);
  });


  // Disconnection
  socket.on('disconnect', function(){

    // Clear the user if defined
    if(socketRoomId && socketUserId) {
      Sockets.disconnect(socketRoomId, socketUserId);
    }

  });

});