// ================
// Playlist service
// ================

angular.module('app.services.playlist', ['app.services.sync', 'app.services.user'])
.factory('Playlist', function($rootScope, $timeout, $window, Sync, User){

  $rootScope.appLoaded = false;  

  var cooldown = 15000; // 15 seconds

  // Track model
  function Track(opts) {
    this.id = opts.id;
    this.score = opts.score;
    this.targetScore = opts.score;

    this.upvoting = false;
    this.lastUpvote = 0;

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



  Track.prototype.upvote = function(){
    // Not been 10 seconds : ignore
    if ( Date.now() - this.lastUpvote < cooldown) {
      return;
    }

    var self = this;

    var score = (self.status === 'new') ? 2 : 1;
    self.upvoting = true;

    // Optimistic upvote
    self.bumpBy(score);
    this.lastUpvote = Date.now();

    Sync.upvoteTrack(self.id, function(res, msg){
      self.upvoting = false;

      // Nok
      if (!res) {
        console.log('Upvote error : ', msg);
        Sync.reload();
        return;
      }

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

  Track.compare = function(a,b){
    return (b.score - a.score) || (a.created_at - b.created_at);
  };

  Track.cooldown = 10000; // 10 seconds


  // Current tracks, indexed by id
  var Playlist = {};
  Playlist.Track = Track;
  Playlist.tracks = [];
  Playlist.index = {};
  Playlist.playing = null;



  // Bootstraping the playlist
  Playlist.bootstrap = function(data){
    // Clear the playlist
    Playlist.tracks = [];
    Playlist.index = {};

    // Store the current track
    this.playing = {
      artist: data.playing.artist,
      title: data.playing.title
    }

    // Trick for entering them progressively
    var allTracks = _.map(data.tracks, function(trackOpts){
      return new Track(trackOpts);
    });

    allTracks.sort(Track.compare);

    var gradualAppend = function(){
      var toAdd = allTracks.shift();
      if (!!toAdd) {
        Playlist.tracks.push(toAdd);
        Playlist.index[toAdd.id] = toAdd;      
        $timeout(gradualAppend, 100);
      }
    };
    gradualAppend();
  };

  // Add a new track
  Playlist.newTrack = function(trackOpts){
    if (! _.has(Playlist.index, trackOpts.id)) {
      var track = new Track(trackOpts);
      Playlist.tracks.push(track);
      Playlist.index[track.id] = track;
    }
  };

  Playlist.updateTrack = function(trackOpts){
    var track = Playlist.index[trackOpts.id];
    track.setAttrs(trackOpts);
  };

  Playlist.playingTrack = function(trackOpts){
    console.log('playist is playing', trackOpts);

    Playlist.playing = {
      title: trackOpts.title,
      artist: trackOpts.artist
    };    
  };

  Playlist.deleteTrack = function(trackOpts){
    _.remove(Playlist.tracks, function(track){
      return track.id === trackOpts.id;
    });

    delete Playlist.index[trackOpts.id];
  };

  Playlist.hasTrack = function(trackId){
    return _.has(Playlist.index, trackId);
  };

  Playlist.isPlaying = function(){
    return this.playing && !!this.playing.title && !!this.playlist.artist
  };

  return Playlist;

});

