// Wrapper around the mongo database
// Expose methods for querying and updating records
// Returns promises
var Q         = require('q'),
    _         = require('lodash'),
    redis     = require('redis'),
    client    = redis.createClient(),
    Pubsub    = require('./pubsub.js');


// =============
// Redis helpers
// =============
var set = Q.nbind(client.set, client);
var get = Q.nbind(client.get, client);
var zrevrangebyscore = Q.nbind(client.zrevrangebyscore, client);
var zscore = Q.nbind(client.zscore, client);
var zincrby = Q.nbind(client.zincrby, client);
var zadd = Q.nbind(client.zadd, client);
var hset = Q.nbind(client.hset, client);
var hmset = Q.nbind(client.hmset, client);
var hgetall = Q.nbind(client.hgetall, client);
var decrby = Q.nbind(client.decrby, client);
var keys = Q.nbind(client.keys, client);
var del = Q.nbind(client.del, client);
var zrem = Q.nbind(client.zrem, client);
var incr = Q.nbind(client.incr, client);

// ===========
// Track model
// ===========
var Track = function(roomId, id){
  this.id = parseInt(id, 10);
  this.room = new Room(roomId);
  this.key = 'watdj:rooms:' + roomId + ':tracks:' + id;
};

Track.prototype.get = function() {
  var self = this;

  return this.room.trackScore(this.id)
  .then(function(score){
    if (!score) { return null; }
    return hgetall(self.key)
    .then(function(attrs){
      if (!attrs) { return null; }
      return {
        id: self.id,
        roomId: self.room.id,
        score: score,
        status: attrs.status,
        artist: attrs.artist,
        title: attrs.title,
        created_at: parseInt(attrs.created_at, 10),
        last_upvote_at: parseInt(attrs.last_upvote_at, 10)
      };
    });
  });
};

Track.prototype.create = function(args) {
  var self = this;

  // Check existing before
  return this.get()
  .then(function(exists){
    if (!!exists) {
      return [false, null];
    }
    else {
      var attrs = {
        title: args.title,
        artist: args.artist,
        created_at: Date.now(),
        last_upvote_at: Date.now(),
        status: 'new',
      };
      var score = 1;

      return hmset(self.key, attrs)
      .then(function(){
        return self.room.addTrack(self.id);
      })
      .then(function(){
        return self.get();
      })
      .then(function(attrs){
        return [true, attrs];
      });
    }
  });
};

Track.prototype.setAttr = function(key, value) {
  var self = this;

  return this.get()
  .then(function(trackAttrs){
    if( !trackAttrs ){
      return false;
    }
    if ( trackAttrs[key] === value ){
      return false;
    }
    else {
      return hset(self.key, key, value)
      .then(function(){
        self.notifyUpdate();
      })
      .then(function(){
        return true;
      });
    }
  });
};

Track.prototype.delete = function() {
  console.log('deleting track', this);
  var self = this; 

  return this.room.deleteTrack(this.id);
};

Track.prototype.score = function() {
  return this.room.trackScore(this.id);
};

Track.prototype.pingLastUpvote = function() {
  var now = Date.now();
  console.log('pinging last upvote', now);
  return hset(this.key, 'last_upvote_at', now).then(function(res){
    console.log('ping upvote ok! : res');

  });
};

Track.prototype.die = function() {
  var self = this;

  // Downvote 1
  return this.get()
  .then(function(attrs){
    if (!attrs) { console.log('already dead'); return false; }

    return self.room.upvote(self.id, -1)
    .then(function(score){
      // Score is 0 : deletion
      if (score <= 0) {
        console.log('score 0, delete');
        return self.delete()
        .then(function(res){
          return Track.notifyDelete(attrs);
        });
      }
      else {
        console.log('score not 0, update');
        return self.notifyUpdate()
        .then(function(){ return true; });
      }
    });
  });
};

Track.prototype.notifyNew = function() {
  return this.get()
  .then(function(trackAttrs){
    return Pubsub.notifyNewTrack(trackAttrs);
  }); 
};

Track.prototype.notifyUpdate = function() {
  return this.get()
  .then(function(trackAttrs){
    return Pubsub.notifyUpdateTrack(trackAttrs);
  }); 
};

Track.notifyDelete = function(trackAttrs) {
  return Pubsub.notifyDeleteTrack(trackAttrs);
};


// ==========
// User model
// ==========
var User = function(roomId, id){
  this.room = new Room(roomId);
  this.id = id;
  this.key = 'watdj:rooms:' + roomId + ':users:' + id;
};

User.prototype.get = function() {
  var self = this;

  return get(this.key)
  .then(function(votes){
    if (!votes){
      return null;
    }
    else{
      return {
        id: self.id,
        roomId: self.room.id,
        votes: parseInt(votes, 10)
      }
    }
  });
};

User.prototype.findOrCreate = function() {
  var self = this;

  return this.get()
  .then(function(attrs){
    if(attrs){
      return [false, null];
    }
    else{
      return self.create()
      .then(function(attrs){
        return [true, attrs];
      });
    }
  });
};

User.prototype.create = function() {
  var self = this;

  var votes = 1;
  return set(this.key, votes)
  .then(function(){
    return self.get();
  });
};

User.prototype.notifyNew = function() {
  var self = this;

  this.get()
  .then(function(userAttrs){
    Pubsub.notifyNewUser(self.room.id, userAttrs);    
  });
};

User.prototype.notifyUpdate = function() {
  return this.get()
  .then(function(userAttrs){
    Pubsub.notifyUpdateUser(userAttrs);
  });
};

User.prototype.removeVotes = function(score) {
  var self = this;

  return decrby(this.key, score)
  .then(function(){
    return true;
  });
};

User.prototype.addVote = function() {
  var self = this;
  console.log('addingvote');
  return incr(this.key)
  .then(function(){
    console.log('incremented');
    return self.notifyUpdate();
  })
  .then(function(){
    console.log('notified');
    return self.get();
  });
};

// ==========
// Room model
// ==========
var Room = function(id){
  this.id = id;
  this.playlistKey = 'watdj:rooms:' + id + ':playlist';
};

Room.prototype.tracks = function() {
  var self = this;

  return this.trackIds()
  .then(function(trackIds){
    return Q.all(_.map(trackIds, function(trackId){
      var track = new Track(self.id, trackId);
      return track.get();
    }));
  })
  .then(function(trackWithDetails){
    return _.compact(trackWithDetails);
  });
};

Room.prototype.trackIds = function(first_argument) {
  return zrevrangebyscore(this.playlistKey, '+inf', 0, 'withscores')
  .then(function(raw_res){
    var ids = [];
    for (var i = 0 ; i < (raw_res.length/2) ; i++) {
      ids.push(raw_res[2*i]);
    }
    return ids;
  });
};

Room.prototype.trackScore = function(trackId) {
  return zscore(this.playlistKey, trackId)
  .then(function(res){
    return parseInt(res);
  });
};

Room.prototype.addTrack = function(trackId) {
  return zadd(this.playlistKey, 1, trackId)
};

Room.prototype.upvote = function(trackId, score) {
  return zincrby(this.playlistKey, score, trackId)
  .then(function(score){
    return parseInt(score, 10);
  });
};

Room.prototype.deleteTrack = function(trackId) {
  console.log('deleting track from playlist');
  return zrem(this.key, trackId)
  .then(function(){
    console.log('deleted track from playlist');
    return true;
  });
};


// =======
// Helpers
// =======



// =======
// Exports
// =======

var DB = {};

// Add a user
// Returns bool (added or not)
DB.addUser = function(roomId, userId){

  var user = new User(roomId, userId);

  return user.findOrCreate()
  .then(function(res){
    var created = res[0];
    var userAttrs = res[1];
    if (created) {
      user.notifyNew();
      return true;
    }
    else {
      return false;
    }
  });

};

// Get a users attrs
// - score
DB.getUserAttrs = function(roomId, userId){
  var user = new User(roomId, userId);
  return user.get();
};

// Get the playlist
// [track attrs]
DB.getPlaylist = function(roomId){
  var room = new Room(roomId);
  return room.tracks();
};

// Add a track
DB.addTrack = function(roomId, trackAttrs){
  var track = new Track(roomId, trackAttrs.id);
  return track.create(trackAttrs)
  .then(function(res){
    var success = res[0];
    var attrs = res[1];

    if (success) {
      track.notifyNew();
      return attrs
    }
    else {
      return false;
    }
  });
};

// Upvote a track
DB.upvoteTrack = function(roomId, userId, trackId, score){
  var track = new Track(roomId, trackId);
  var user = new User(roomId, userId);
  var room = new Room(roomId);

  // Check both exist and are allowed
  return track.get()
  .then(function(trackAttrs){
    if (!trackAttrs) { throw 'No track found'; }

    return user.get()
    .then(function(userAttrs){
      if (!userAttrs || userAttrs.votes < score) { throw 'Not enough votes'; }

      return user.removeVotes(score)
      .then(function(){
        console.log('upvoting track')
        if (trackAttrs.status === 'new') {
          score = score * 2;
        }
        return room.upvote(trackId, score)
      })
      .then(function(){
        console.log('pinging upvote');
        return track.pingLastUpvote();
      })
      .then(function(res){
        console.log('pinged last upvote')
        track.notifyUpdate();
        user.notifyUpdate();
        return true;
      });
    });
  })
};

// Get all tracks
DB.getAllTracks = function(){
  console.log('getting all tracks');
  return keys('watdj:rooms:*:tracks:*')
  .then(function(keys){
    console.log('keys : ', keys);
    return Q.all( _.map(keys, function(key){
      var splitKey = key.split(':');
      var roomId = splitKey[2];
      var trackId = splitKey[4];
      return (new Track(roomId, trackId)).get();
    }) );
  })
  .then(function(tracks){
    return _.compact(tracks);
  });
};

// Set a track's status
DB.setTrackStatus = function(roomId, trackId, newStatus){
  var track = new Track(roomId, trackId);
  return track.setAttr('status', newStatus);
};

// Make a track die (downvote 1, delete if 0)
DB.dieTrack = function(roomId, trackId){
  console.log('dying track', trackId);
  var track = new Track(roomId, trackId);
  return track.die();
};

DB.getAllUsers = function(){
  return keys('watdj:rooms:*:users:*')
  .then(function(keys){
    console.log('keys : ', keys);
    return Q.all( _.map(keys, function(key){
      var splitKey = key.split(':');
      var roomId = splitKey[2];
      var userId = splitKey[4];
      return (new User(roomId, userId)).get();
    }) );
  })
  .then(function(users){
    return _.compact(users);
  });
},

DB.addUserVote = function(roomId, userId){
  console.log('adding vote to', roomId, userId);
  var user = new User(roomId, userId);
  return user.addVote();
};

module.exports = DB;