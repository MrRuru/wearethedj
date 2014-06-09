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
  _.each(_sockets[roomId], function(socket){
    socket.emit(event, data);
  });
};


Sockets.register = function(socket){

  // Get the userId and roomId
  var userId = socket.userId;
  var roomId = socket.roomId;

  if (!userId || !roomId) {
    throw('Cannot register an invalid socket. userId is ' + userId + ' roomId is ' + roomId);
  }

  // Store the socket object
  _sockets[roomId] = _sockets[roomId] || {};
  _sockets[roomId][userId] = socket;

  // Add listeners
  _.each(_listeners, function(listener){

    socket.on(listener.name, function(data, cb){
      var context = new Context(userId, roomId);
      listener.cb(context, data, cb);
    });

  });

  console.log('New socket. All are : ', _sockets);
};

Sockets.unregister = function(socket){

  // Get the userId and roomId
  var userId = socket.userId;
  var roomId = socket.roomId;

  if (!userId || !roomId || !_sockets[roomId] || !_sockets[roomId][userId]) {
    console.log('[SOCKETS] Trying to unregister an invalid socket. userId is ' + userId + ' roomId is ' + roomId);
    return;
  }

  delete _sockets[roomId][userId];

  console.log('Deleted socket. All are : ', _sockets);
};

module.exports = Sockets;