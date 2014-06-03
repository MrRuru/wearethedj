// Handle socket messages, and link with pubsub
var Pubsub = require('./pubsub.js'),
    _      = require('lodash'),
    DB     = require('./database.js');

var _sockets = {}; // roomId => RoomSockets instance

var RoomSockets = function(roomId){
  this.id = roomId;
  this.userSockets = {};
  this.subbers = [];
  this.bindToPubsub();
};

RoomSockets.prototype.unlink = function() {
  // Clear subbers
  _.each(this.subbers, function(subber){
    // Close the client
    subber.quit();
  });

  // Close sockets
  delete this.userSockets;
};

RoomSockets.prototype.addUser = function(userId, socket) {
  this.userSockets[userId] = socket;
  this.listenToSocket(socket, userId);
    
  // Boostrap user data
  var roomId = this.id;
  return DB.addUser(roomId, userId)
  .then(function(){

    DB.getUserAttrs(roomId, userId).then(function(attrs){
      socket.emit('bootstrapUser', attrs);
    }).done();

    DB.getPlaylist(roomId).then(function(attrs){
      socket.emit('bootstrapPlaylist', attrs);
    }).done();

  })
  .done();
};

RoomSockets.prototype.removeUser = function(userId) {
  // Dereference the socket
  delete this.userSockets[userId];
};

RoomSockets.prototype.bindToPubsub = function() {
  var self = this;

  // Messages to listen and forward
  this.subbers.push(Pubsub.onNewTrack(this.id, function(trackAttrs){
    self.broadcast('newTrack', trackAttrs);
  }));

  this.subbers.push(Pubsub.onUpdateTrack(this.id, function(trackAttrs){
    self.broadcast('updateTrack', trackAttrs);
  }));

  this.subbers.push(Pubsub.onDeleteTrack(this.id, function(trackAttrs){
    self.broadcast('deleteTrack', trackAttrs);
  }));

  this.subbers.push(Pubsub.onPlayingTrack(this.id, function(trackAttrs){
    self.broadcast('playingTrack', trackAttrs);
  }));

  this.subbers.push(Pubsub.onUpdateUser(this.id, function(userAttrs){
    self.notifyUser(userAttrs.id, 'updateUser', userAttrs);
  }));
};

RoomSockets.prototype.listenToSocket = function(socket, userId) {
  var self = this;

  // Add track
  socket.on('addTrack', function(trackData, cb){
    DB.addTrack(self.id, trackData).then(
      function(res){ cb(true, res); },
      function(err){ cb(false, err); }
    );
  });

  // Upvote track
  socket.on('upvote', function(trackData, cb){
    DB.upvoteTrack(self.id, userId, trackData.trackId, trackData.score).then(
      function(res){ cb(true, res); },
      function(err){ cb(false, err); }
    );
  });  
};

RoomSockets.prototype.notifyUser = function(userId, message, data) {
  var userSocket = this.userSockets[userId];
  if (userSocket) {
    userSocket.emit(message, data);
  }
};

RoomSockets.prototype.broadcast = function(message, data) {
  console.log('broadcasting', message, data);
  _.each(_.values(this.userSockets), function(socket){
    socket.emit(message, data);
  });
};

// Find or create
RoomSockets.get = function(roomId){
  if (!_.has(_sockets, roomId)) {
    _sockets[roomId] = new RoomSockets(roomId);
  }
  return _sockets[roomId];
};



module.exports = {
  connect: function(roomId, userId, socket){
    return RoomSockets.get(roomId).addUser(userId, socket);
  },

  disconnect: function(roomId, userId){
    return RoomSockets.get(roomId).removeUser(userId);
  }
};
