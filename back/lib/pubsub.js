// Wrapper around the redis pubsub
var redis     = require('redis'),
    publisher = redis.createClient();

var Pubsub = {};

//  Keys
var keys = {
  base:           function()        { return 'watchdb:ps'; },
  room:           function(rid)     { return this.base()          + ':rooms:'   + (rid || '*'); },
  user:           function(rid, id) { return this.room(rid)       + ':users:'   + (id  || '*'); },
  track:          function(rid, id) { return this.room(rid)       + ':tracks:'  + (id  || '*'); },
  new_user:       function(rid, id) { return this.user(rid, id)   + ':new'    },
  new_track:      function(rid, id) { return this.track(rid, id)  + ':new'    },
  update_user:    function(rid, id) { return this.user(rid, id)   + ':update' },
  update_track:   function(rid, id) { return this.track(rid, id)  + ':update' },
  delete_user:    function(rid, id) { return this.user(rid, id)   + ':delete' },
  delete_track:   function(rid, id) { return this.track(rid, id)  + ':delete' },
  playing_track:  function(rid, id) { return this.track(rid, id)  + ':play'   }
};


// Publisher help
var publish = function(key, data) {
  console.log('PUBBER : sending', key, 'with', data);

  var message = JSON.stringify(data);

  publisher.publish( key, message );
};


//  Subber creation help
var subscribe = function(key, cb) {
  var subber = redis.createClient();

  subber.on('pmessage', function(pchannel, channel, message){

    var data = JSON.parse(message);

    console.log('SUBBER : received', channel, 'with', data);

    var splitChannel = channel.split(':');

    // Dirty, application should not need 3-level notifications
    // Should not be too hard to make generic
    var roomId   = splitChannel[2];
    var id       = splitChannel[4]; // Room or track

    cb(roomId, id, data);
  });

  subber.on('psubscribe', function(pchannel){
    console.log('SUBBER - subscribed to', pchannel);
  });

  subber.psubscribe(key);

  return subber;
};



// =======
// Exports
// =======
Pubsub.notifyNewUser = function(user){
  publish( keys['new_user'](user.roomId, user.id), user );
};

Pubsub.notifyUpdateUser = function(user){
  publish( keys['update_user'](user.roomId, user.id), user );
};

Pubsub.notifyNewTrack = function(track){
  publish( keys['new_track'](track.roomId, track.id), track );
};

Pubsub.notifyUpdateTrack = function(track){
  publish( keys['update_track'](track.roomId, track.id), track );
};





Pubsub.onNewTrack = function(roomId, cb){
  return subscribe( keys['new_track'](roomId), function(roomId, trackId, data){
    cb(data);
  });
};

Pubsub.onUpdateTrack = function(roomId, cb){
  return subscribe( keys['update_track'](roomId), function(roomId, trackId, data){
    cb(data);
  });
};

Pubsub.onDeleteTrack = function(roomId, cb){
  return subscribe( keys['delete_track'](roomId), function(roomId, trackId, data){
    cb(data);
  });
};

Pubsub.onPlayingTrack = function(roomId, cb){
  return subscribe( keys['playing_track'](roomId), function(roomId, trackId, data){
    cb(data);
  });
};

Pubsub.onNewUser = function(roomId, cb){
  return subscribe( keys['new_user'](roomId), function(roomId, userId, data){
    cb(data);
  });
};

Pubsub.onUpdateUser = function(roomId, cb){
  return subscribe( keys['update_user'](roomId), function(roomId, userId, data){
    cb(data);
  });
};

Pubsub.onUserRemoved = function(roomId, cb){
  return subscribe( keys['delete_user'](roomId), function(roomId, userId, data){
    cb(data);
  });
};


module.exports = Pubsub;