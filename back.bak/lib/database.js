// Wrapper around the mongo database
// Expose methods for querying and updating records
// Returns promises
var Q         = require('q'),
    _         = require('lodash'),
    redis     = require('redis'),
    client    = redis.createClient(),
    Pubsub    = require('./pubsub.js'),
    Track     = require('./track.js'),
    User      = require('./user.js'),
    Room      = require('./room.js');


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