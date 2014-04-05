var Adapter = require('./lib/adapter.js'),
    _       = require('lodash');

var NEW_DURATION = parseInt(process.env.NEW_DURATION, 10) || 3000; // seconds
var TTL_DURATION = parseInt(process.env.NEW_DURATION, 10) || 9000; // seconds
var MULTIPLIER = parseInt(process.env.MULTIPLIER, 10) || 1; // Higher = steeper downfall
var _rooms = {}; // Sort tracks by room


// Individual track logic

var Track = function(roomId, opts){
  console.log('initializing track with ', opts);
  this.id = opts.id;
  this.roomId = roomId;
  this.status = opts.status;

  this.nextTimeout = null;

  this.initialize();
};

Track.prototype.destroy = function(){
  console.log('destroying track', this);
  clearTimeout(this.nextTimeout);
};

Track.prototype.initialize = function(){
  console.log('initializing TTL for track', this.id);
  var self = this;

  // New track : remove new status next
  if ( this.status === "new" ) {
    console.log(this.id, 'is a new track, programming status down');
    this.programAlive();
  }

  // Dying : launch cooldown
  else if ( this.status === "down" ) {
    console.log(this.id, 'is dying, killing it now');
    this.programDeath();
  }

  // Normal 
  else {
    console.log(this.id, 'is a not new anymore, programming death');
    this.programDying();
  }

};

Track.prototype.updateStatus = function(newStatus){
  console.log('updating', this.id, 'status : ', newStatus);
  var self = this;

  if (this.status === newStatus) {
    return;
  }

  return Adapter.setStatus(this.roomId, this.id, newStatus)
  .then(function(res){
    if(!res){
      console.log('could not update status');
      return false;
    }
    console.log('status upate ok');
    self.status = newStatus;
    return true;
  });
};

Track.prototype.programAlive = function(){
  console.log('programming', this.id, 'to be alive');
  var self = this;
  this.nextTimeout = setTimeout(function(){
    self.setAlive();
  }, NEW_DURATION);
};

Track.prototype.setAlive = function(){
  console.log('setting', this.id, 'alive');
  var self = this;
  clearTimeout(this.nextTimeout);
  this.updateStatus('')
  .then(function(res){
    if(!!res){
      self.programDying();
    }
  })
  .done();
};

Track.prototype.programDying = function(){
  console.log('programming', this.id, 'to be dying');
  var self = this;
  this.nextTimeout = setTimeout(function(){
    self.setDying();
  }, TTL_DURATION);
};

Track.prototype.setDying = function(){
  console.log('setting', this.id, 'dying');
  var self = this;
  clearTimeout(this.nextTimeout);
  this.updateStatus('down')
  .then(function(res){
    if(!!res){
      self.programDeath();
    }
  })
  .done();
};

Track.prototype.programDeath = function(){
  console.log('programming', this.id, 'to be dead');
  var self = this;

  var die = function(){
    console.log('killing', self.id);
    // Downvote

    // Get new score

    // Return if none (TODO : adapter delete if 0)

    // Calculate new TTL
    var nextTick = 100;

    this.nextTimeout = setTimeout(die, nextTick);
  };

  die();
};


// Boostraping and monitoring
var refreshTrack = function(roomId, trackId){
  // Check if track exists
  
  track.setAlive();
};

var importTrack = function(roomId, trackDetails){
  if (!_.has(_rooms, roomId)) {
    _rooms[roomId] = {};
  }

  if (!_.has(_rooms[roomId], trackDetails.id)) {
    console.log('building track');
    _rooms[roomId][trackDetails.id] = new Track(roomId, trackDetails);
  }
  else {
    console.log('replacing track');
    _rooms[roomId][trackDetails.id].destroy();
    _rooms[roomId][trackDetails.id] = new Track(roomId, trackDetails);
  }
};

var bootstrap = function(){
  Adapter.getAllTracks().then(function(res){

    _.each(res, function(roomAndTrack){
      var roomId = roomAndTrack[0];
      var trackId = roomAndTrack[1];

      Adapter.getTrack(roomId, trackId)
      .then(function(trackDetails){
        trackDetails.id = trackId;
        importTrack(roomId, trackDetails);
      })
      .done();

    });
  })
  .done();
};


// Listeners
// Adapter.onAllNewTracks(function(roomId, trackDetails){
//   importTrack(roomId, trackDetails);
// });

// Listeners
// Adapter.onAllUpvotes(function(roomId, trackDetails){
//   refreshTrack(roomId, trackDetails);
// });


bootstrap();