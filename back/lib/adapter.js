// DB adapter logic.
// Namespaced under a room id.

// Dependencies
var redis  = require('redis'),
    Q      = require('q'),
    _      = require('lodash'),
    client = redis.createClient();


var Adapter = {};


// Redis keys
var baseKey = 'plst';

var roomKey = function(roomId){ 
  return baseKey + ':rooms:' + roomId;
};

var userKey = function(roomId, userId){ 
  return roomKey(roomId) + ':users:' + userId;
};

var playlistKey = function(roomId){
  return roomKey(roomId) + ':playlist';
};

var trackKey = function(roomId, trackId){
  return roomKey(roomId) + ':tracks:' + trackId;
};


// Helpers
var upvoteTrack = function(roomId, trackId, score){
  return Q.ninvoke(client, 'zincrby', playlistKey(roomId), score, trackId);
};

var downvoteTrack = function(roomId, trackId){
  return checkTrackExist(roomId, trackId)
  .then(function(res){
    if(!res){
      return false;
    }
    else{
      return upvoteTrack(roomId, trackId, -1)
      .then(function(res){
        // Check if track deleted
        if (res == 0) {
          deleteTrack(roomId, trackId);
          return false;
        }
        else {
          return true;
        }
      });
    }
  });
};

var deleteTrack = function(roomId, trackId){
  return Q.ninvoke(client, 'zrem', playlistKey(roomId), trackId).then(function(){
    return Q.ninvoke(client, 'del', trackKey(roomId, trackId)).then(function(){
      notifyTrackDeleted(roomId, trackId);
    });
  });
};

// Exists = score && score != 0
var checkTrackExist = function(roomId, trackId){
  return getTrackScore(roomId, trackId)
  .then(function(res){
    return !!res;
  });
};

var getTrack = function(roomId, trackId){
  return Q.ninvoke(client, 'hgetall', trackKey(roomId, trackId))
  .then(function(details){
    if (!details) {
      return false;
    }

    details.created_at = parseInt(details.created_at, 10);
    return details;
  });
};

var getTrackScore = function(roomId, trackId){
  return Q.ninvoke(client, 'zscore', playlistKey(roomId), trackId)
  .then(function(score){
    if (!score) {
      return false;
    }
    else {
      return parseInt(score, 10);
    }
  });
};

var getTrackWithScore = function(roomId, trackId){
  return getTrack(roomId, trackId)
  .then(function(trackDetails){
    if (!trackDetails) {
      return false;
    }
    else {
      // Merge score
      return getTrackScore(roomId, trackId)
      .then(function(score){
        if (!score) {
          return false;
        }
        else {
          trackDetails.score = score;
          return trackDetails;
        }
      });
    }
  });
};

var setBaseScore = function(roomId, trackId){
  console.log('setting base score',  roomId, trackId);
  return getTrackScore(roomId, trackId)
  .then(function(score){
    // Existing : return
    if (!!score) {
      console.log('track already upvoted', score);
      return false;
    }

    // Else, set to 1 and return true
    else {
      console.log('upvoting track');
      return Q.ninvoke(client, 'zadd', playlistKey(roomId), 1, trackId)
      .then(function(){ return true });
    }
  });
};

var addNewTrack = function(roomId, trackData){
  // Check if existing
  return checkTrackExist(roomId, trackData.id).then(function(exists){

    if (exists) {
      console.log('track existing', res);
      return false;
    }
    else {
      console.log('creating track');
      return Q.ninvoke(client, 'hmset', trackKey(roomId, trackData.id), {
        artist: trackData.artist,
        title: trackData.title,
        created_at: Date.now(),
        status: 'new'
      });
    }

  });
};

var setTrackAttr = function(roomId, trackId, key, value){
  return Q.ninvoke(client, 'hset', trackKey(roomId, trackId), key, value);
};

var popTopTrack = function(roomId){
  return Q.ninvoke(client, 'zrevrangebyscore', playlistKey(roomId), '+inf', 0, 'limit', 0, 1)
  .then(function(res){
    // Get the track id
    var trackId = parseInt(res[0], 10);

    // Delete the track and return the id
    return deleteTrack(roomId, trackId)
    .then(function(){
      return trackId;
    });
  });
};


// Publishers
var notifyTrackAdded = function(roomId, trackData){
  console.log('publishing on redis', 'plst:pubsub:rooms:'+roomId+':newtrack', JSON.stringify(trackData));
  client.publish('plst:pubsub:rooms:'+roomId+':newtrack', JSON.stringify(trackData));
};

var notifyTrackUpvoted = function(roomId, trackId, score){
  console.log('publishing on redis', 'plst:pubsub:rooms:'+roomId+':tracks:'+trackId+':upvote', score);
  client.publish('plst:pubsub:rooms:'+roomId+':tracks:'+trackId+':upvote', score);
};

var notifyTrackUpdate = function(roomId, trackId, changes){
  console.log('publishing on redis', 'plst:pubsub:rooms:'+roomId+':tracks:'+trackId+':update', changes);
  client.publish('plst:pubsub:rooms:'+roomId+':tracks:'+trackId+':update', JSON.stringify(changes));
};

var notifyTrackDeleted = function(roomId, trackId){
  console.log('publishing on redis', 'plst:pubsub:rooms:'+roomId+':deleted', trackId);
  client.publish('plst:pubsub:rooms:'+roomId+':deleted', trackId);
};

var notifyTrackPlaying = function(roomId, trackId){
  console.log('publishing on redis', 'plst:pubsub:rooms:'+roomId+':playing', trackId);
  client.publish('plst:pubsub:rooms:'+roomId+':playing', trackId);
};


// Get user details
// - votes
Adapter.getUser = function(roomId, userId){
  return Q.ninvoke(client, 'get', userKey(roomId, userId)).then(function(res){
    return {votes: (res || 10)};
  });
};

// Get track details
Adapter.getTrack = getTrack;

// Add a new track if not yet existing
// wants id, artist, title
// returns boolean (added or not)
Adapter.addTrack = function(roomId, trackData){

  // Create details hash (if missing)
  return addNewTrack(roomId, trackData)

  // Set base score
  // Return true or false depending on score existence
  .then(function(){ return setBaseScore(roomId, trackData.id); })

  // Notify the room if new track
  .then(function(added){ 
    if (added) {
      return getTrackWithScore(roomId, trackData.id)
      .then(function(trackDetails){
        if(trackDetails){
          notifyTrackAdded(roomId, trackDetails);
        }
      });
    }
    else {
      return false;
    }
  })
};


// Upvote an existing track (if existing)
Adapter.upvoteTrack = function(roomId, trackId, score){

  console.log('upvoting track', trackId, 'by', score);

  // Check if existing before
  return getTrack(roomId, trackId)
  .then(function(res){
    if (!res) {
      return false;
    }
    else {
      return upvoteTrack(roomId, trackId, score)
      .then(function(newScore){ notifyTrackUpvoted(roomId, trackId, newScore) });
    }
  });

};


// Get the playlist
// - id
// - score
// - artist
// - title
Adapter.getPlaylist = function(roomId){
  return Q.ninvoke(client, 'zrevrangebyscore', playlistKey(roomId), '+inf', 0, 'withscores')
  .then(function(res){
    console.log('raw playlist : ', res);
    // The result is in the form [id, score, id, score, ...]. Format it in the form [{id: id, score: score}, ...]
    var formattedRes = [];

    for (var i = 0 ; i < (res.length/2) ; i++) {
      formattedRes.push({
        id: res[2*i],
        score: parseInt(res[2*i + 1], 10)
      });
    }

    return formattedRes;
  })
  .then(function(tracksWithScore){
    var fullTracks = _.map(tracksWithScore, function(trackWithScore){
      return getTrack(roomId, trackWithScore.id).then(function(trackDetails){

        if (trackDetails) {
          trackDetails.id = trackWithScore.id;
          trackDetails.score = trackWithScore.score;
          return trackDetails;
        }

        else {
          return null;
        }

      });
    });
    return Q.all(fullTracks);
  })
  .then(function(tracksWithDetails){
    return _.compact(tracksWithDetails);
  });
};


// Pop the top track in a playlist
Adapter.popTopTrack = function(roomId){
  return popTopTrack(roomId)
  .then(function(trackId){

    // Notify the track is popped
    notifyTrackPlaying(roomId, trackId);

    return trackId;
  })
};


// Get all the tracks (only bootstrap, to avoid)
Adapter.getAllTracks = function(){
  return Q.ninvoke(client, 'keys', 'plst:rooms:*:tracks:*')
  .then(function(res){
    // Map the res to a [roomId, trackId] array
    return _.map(res, function(key){
      var splitKey = key.split(':');
      var roomId = splitKey[splitKey.length - 3];
      var trackId = parseInt(splitKey[splitKey.length - 1], 10);
      return [roomId, trackId];
    });
  });
};

// Set a tracks status
Adapter.setStatus = function(roomId, trackId, newStatus){

  // Check if still here
  return checkTrackExist(roomId, trackId)
  .then(function(exists){
    if (!exists) {
      return false;
    };

    return setTrackAttr(roomId, trackId, 'status', newStatus)
    .then(function(res){
      notifyTrackUpdate(roomId, trackId, {status: newStatus});
      return true;
    });

  })
};


// Redis subbers
// TODO : cleanup on disconnects...
Adapter.onNewTrack = function(roomId, cb){
  var subber = redis.createClient();

  subber.on('message', function(channel, message){
    cb(JSON.parse(message));
  });

  subber.subscribe('plst:pubsub:rooms:'+roomId+':newtrack');
};

Adapter.onUpvoteTrack = function(roomId, cb){
  var subber = redis.createClient();

  subber.on('pmessage', function(pchannel, channel, message){
    console.log('SUBBER : got message', message, 'from channel', channel);
    var splitChannel = channel.split(':');
    var trackId = parseInt(splitChannel[splitChannel.length - 2], 10);
    var score = parseInt(message, 10);
    cb(trackId, score);
  });

  subber.psubscribe('plst:pubsub:rooms:'+roomId+':tracks:*:upvote');
};

Adapter.onTrackPlaying = function(roomId, cb){
  var subber = redis.createClient();

  subber.on('message', function(channel, message){
    cb(parseInt(message, 10));
  });

  subber.subscribe('plst:pubsub:rooms:'+roomId+':playing');
};


module.exports = Adapter;