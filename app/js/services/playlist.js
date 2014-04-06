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
    this.artist = opts.artist;
    this.title = opts.title;
    this.status = opts.status;
    this.created_at = opts.created_at;
    this.upvoting = false;
    this.pendingVotes = 0;
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
    this.upvoting = true;
    var score = this.pendingVotes;
    this.pendingVotes = 0;

    var self = this;

    Sync.upvoteTrack(this.id, score, function(res, err){
      if(!res){
        alert('error : ', err);
      }
      User.clearVotes(self.id);
      self.upvoting = false;
      self.bumpTo(self.score + score);
    });
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
  var addTrack = function(trackOpts){
    if (! _.has(_tracks, trackOpts.id)) {
      _tracks[trackOpts.id] = new Track(trackOpts);
    }
  };

  // Remove a track
  var trackPlaying = function(trackId){
    var track = _tracks[trackId];
    Playlist.playing = {
      title: track.title,
      artist: track.artist
    };
    delete _tracks[trackId];
  };

  // Receive upvotes
  var upvoteTrack = function(data){
    var track = _tracks[data.trackId];
    track.bumpTo(data.score);    
  };

  Playlist = {
    bootstrap: bootstrap,
    addTrack: addTrack,
    trackPlaying: trackPlaying,
    upvoteTrack: upvoteTrack,
    tracks: _tracks,
    playing: {},
    loadedOnce: false
  };

  Sync.setPlaylist(Playlist);
  return Playlist;

});

