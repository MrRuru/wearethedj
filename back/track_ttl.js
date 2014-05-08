var DB      = require('./lib/database.js'),
    Pubsub  = require('./lib/pubsub.js'),
    _       = require('lodash');


var DEFAULT_NEW_DURATION = 1000,
    DEFAULT_TTL_DURATION = 15000,
    DEFAULT_DEATH_RATE = 1;

var _newDuration = ( parseInt(process.env.NEW_DURATION, 10) || DEFAULT_NEW_DURATION ) * 1000; // seconds
    _ttlDuration = ( parseInt(process.env.NEW_DURATION, 10) || DEFAULT_TTL_DURATION ) * 1000; // seconds
    _deathRate   = ( parseFloat(process.env.MULTIPLIER, 10) || DEFAULT_DEATH_RATE   ); // Higher = steeper downfall

var _rooms = {}; // Sort tracks by room


var setTrackTimeout = function(track, delay, fn){
  if (delay < 0) {
    delay = 0;
  }

  clearTimeout(_rooms[track.roomId][track.id]);

  _rooms[track.roomId][track.id] = setTimeout(fn.bind(track), delay);
};

var unlink = function(track){
  clearTimeout(_rooms[track.roomId][track.id]);
  delete _rooms[track.roomId][track.id];
};

var add = function(track){
  console.log('adding', track);
  // Build room if needed
  if (!_.has(_rooms, track.roomId)) {
    console.log('building room', track.roomId);
    _rooms[track.roomId] = {};
  }

  check(track);
};


var bootstrap = function(){
  console.log('bootstraping');

  DB.getAllTracks().then(function(tracks){
    _.each(tracks, add);
  })
  .done();
};

var check = function(track){
  console.log('checking', track);  

  // If new : prepare normal status timeout
  if (track.status === 'new') {
    var normal_in = (track.created_at + _newDuration) - Date.now();
    console.log("setting track normal in", normal_in);
    setTrackTimeout(track, normal_in, function(){
      DB.setTrackStatus(this.roomId, this.id, 'normal').done();
    });
    return;
  }

  // If normal : prepare dying status
  if (track.status === 'normal') {
    var dying_in = (track.last_upvote_at + _ttlDuration) - Date.now();
    console.log('setting track dying in', dying_in);
    setTrackTimeout(track, dying_in, function(){
      DB.setTrackStatus(this.roomId, this.id, 'dying').done();
    });
    return;
  }

  if (track.status === 'dying') {

    // If dying but supposed to be normal (last_upvote_at changed), reupdate status
    var dying_in = (track.last_upvote_at + _ttlDuration) - Date.now();
    if (dying_in > 0) {
      console.log('was dying, back to normal');
      DB.setTrackStatus(track.roomId, track.id, 'normal').done();
      return;
    }

    // Else next hp drop
    var next_drop = (1 / track.score) * 20000;
    setTrackTimeout(track, next_drop, function(){
      DB.dieTrack(this.roomId, this.id).done();
    });
  }
}


// Listeners
Pubsub.onNewTrack(null, function(track){
  add(track);
});

Pubsub.onUpdateTrack(null, function(track){
  check(track);
});

Pubsub.onDeleteTrack(null, function(track){
  unlink(track);
});


bootstrap();