// ================
// Playlist service
// ================

angular.module('app.services.playlist', ['app.services.sync', 'app.services.user'])
.factory('Playlist', function($rootScope, $timeout, Sync, User){

  $rootScope.appLoaded = false;  

  // Track model
  function Track(opts) {
    this.id = opts.id;
    this.score = opts.score;
    this.targetScore = opts.score;

    this.pendingVotes = 0;
    this.upvoting = false;

    this.setAttrs(opts)
  };

  Track.prototype.bumpOne = function(){
    if (this.score === this.targetScore){
      this.bumpTimeout = null;
      return;
    }

    if (this.score < this.targetScore){
      this.score += 1;
    }
    else {
      this.score -= 1;
    }

    var self = this;
    var bumpOne = function(){
      self.bumpOne();
    };
    this.bumpTimeout = $timeout(bumpOne, 30);
  };

  Track.prototype.bumpBy = function(score) {
    this.bumpTo(this.targetScore + score);
  }; 

  Track.prototype.bumpTo = function(targetScore) {
    this.targetScore = targetScore;
    if (!this.bumpTimeout) {
      this.bumpOne();      
    }
  };

  Track.prototype.startUpvote = function(){
    if (this.upvoting || User.votes() <= 0) {
      return;
    }

    console.log('upvoting');
    this.pendingVotes = this.pendingVotes || 0;
    this.pendingVotes += 1;
    User.useVote(this.id);

    if (User.votes() == 0) 
      this.upvote();
    else {
      // Start upvote 1 second later
      $timeout.cancel(this.timeout);
      this.timeout = $timeout(_.bind(this.upvote, this), 1000);
    }
  };

  Track.prototype.upvote = function(){
    var score = this.pendingVotes;
    this.pendingVotes = 0;
    this.upvoting = true;

    var self = this;

    // Optimistic upvote
    this.bumpBy(score);
    var cancelUser = User.clearVotes(this.id);

    Sync.upvoteTrack(this.id, score, function(res, err){
      self.upvoting = false;

      if(res){ return; } // Ok
      if(err){ console.log('Upvote error : err'); }

      // Rollback;
      cancelUser();
    });
  };

  Track.prototype.setAttrs = function(opts) {
    if (opts.score !== this.score) {
      this.bumpTo(opts.score);
    }

    this.artist = opts.artist;
    this.title = opts.title;
    this.status = opts.status;
    this.created_at = opts.created_at;
  };


  // Current tracks, indexed by id
  var Playlist;
  var _tracks = {};

  // Bootstraping the playlist
  var bootstrap = function(data){
    _.each(data, function(trackOpts){
      _tracks[trackOpts.id] = new Track(trackOpts);
    });
  };

  // Add a new track
  var newTrack = function(trackOpts){
    if (! _.has(_tracks, trackOpts.id)) {
      _tracks[trackOpts.id] = new Track(trackOpts);
    }
  };

  var updateTrack = function(trackOpts){
    var track = _tracks[trackOpts.id];
    track.setAttrs(trackOpts);
  };

  var playingTrack = function(trackOpts){
    Playlist.playing = {
      title: trackOpts.title,
      artist: trackOpts.artist
    };    
  };

  var deleteTrack = function(trackOpts){
    delete _tracks[trackOpts.id];
  };

  var hasTrack = function(trackId){
    return _.has(_tracks, trackId);
  };

  Playlist = {
    bootstrap: bootstrap,
    newTrack: newTrack,
    playingTrack: playingTrack,
    updateTrack: updateTrack,
    deleteTrack: deleteTrack,
    tracks: _tracks,
    playing: {},
    loadedOnce: false,
    hasTrack: hasTrack
  };

  return Playlist;

});

