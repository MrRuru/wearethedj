// Handle socket messages, and link with pubsub
var Pubsub = require('./pubsub.js'),
    _      = require('lodash'),
    DB     = require('./database.js');

var _sockets = {}; // roomId => RoomSockets instance

var RoomSockets = function(roomId){
  this.id = roomId;
  this.userSockets = {};
  this.bindToPubsub();
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
  delete this.userSockets[userId];
};

RoomSockets.prototype.bindToPubsub = function() {
  var self = this;

  // Messages to listen and forward
  Pubsub.onTrackAdded(this.id, function(trackAttrs){
    self.broadcast('newTrack', trackAttrs);
  });

  Pubsub.onTrackUpdated(this.id, function(trackAttrs){
    self.broadcast('updateTrack', trackAttrs);
  });

  Pubsub.onTrackRemoved(this.id, function(trackAttrs){
    self.broadcast('removeTrack', trackAttrs);
  });

  Pubsub.onTrackPlaying(this.id, function(trackAttrs){
    self.broadcast('playTrack', trackAttrs);
  });

  Pubsub.onUserUpdated(this.id, function(userAttrs){
    self.notifyUser(userAttrs.id, 'updateScore', userAttrs);
  });
};

RoomSockets.prototype.listenToSocket = function(socket, userId) {
  var self = this;

  // Add track
  socket.on('addTrack', function(trackData, cb){
    DB.addTrack(self.id, trackData).then(
      function(res){ cb(res); },
      function(err){ cb(false, err); }
    );
  });

  // Upvote track
  socket.on('upvote', function(trackData, cb){
    DB.upvoteTrack(self.id, userId, trackData.trackId, trackData.score).then(
      function(res){ cb(res); },
      function(err){ cb(false, err); }
    );
  });  
};

RoomSockets.prototype.notifyUser = function(userId, message, data) {
  if ( _.has(this.userSockets), userId ) {
    this.userSockets[userId].emit(message, data);
  }
};

RoomSockets.prototype.broadcast = function(message, data) {
  _.each(_.values(this.sockets), function(socket){
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