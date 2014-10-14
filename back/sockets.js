// Handle socket storing and querying
var _        = require('lodash'),
    Q        = require('q'),
    Playlist = require('./playlist.js');

var Sockets = {};

// Internal variables
var _sockets = {};
var _listeners = [];


// Context class, used in callbacks
var Context = function(userId, roomId){
  this.userId = userId;
  this.roomId = roomId;
};

Context.prototype.getPlaylist = function(){
  console.log('getting playlist for', this.roomId);
  return Playlist.find(this.roomId);
};


// Sockets registering and binding
Sockets.on = function(event, cb){
  _listeners.push({
    name: event,
    cb: cb
  });
};

Sockets.broadcastRoom = function(roomId, event, data){
  _.each(_sockets, function(socket){
    if (socket.roomId === roomId) {
      socket.emit(event, data);
    }
  });
};

Sockets.loggedInCount = function(roomId){
  return _.size(_.filter(_sockets, function(socket){ return (socket.roomId === roomId); }));
};

Sockets.register = function(socket){

  // Get the userId and roomId
  var userId = socket.userId;
  var roomId = socket.roomId;

  if (!userId || !roomId) {
    throw('Cannot register an invalid socket. userId is ' + userId + ' roomId is ' + roomId);
  }

  // Clear the former socket
  if ( !!_sockets[userId] ) { 
    console.log('deleting former socket', _sockets[userId].id);
    Sockets.unregister(_sockets[userId]);
  }

  // Store the socket object
  socket.roomId = roomId;
  _sockets[userId] = socket;

  // Add listeners
  var context = new Context(userId, roomId);
  _.each(_listeners, function(listener){
    socket.removeAllListeners(listener.name);

    socket.on(listener.name, function(data, cb){
      listener.cb(context, data, cb);
    });

  });

  console.log('New socket. Total all are : ', _.size(_sockets));
};

Sockets.unregister = function(socket){

  // Get the userId and roomId
  var userId = socket.userId;

  if (!userId || !_sockets[userId]) {
    console.log('[SOCKETS] Trying to unregister an invalid socket. userId is ' + userId);
    return;
  }

  delete _sockets[userId];

  console.log('Deleted socket. Total are : ', _.size(_sockets));
};

module.exports = Sockets;