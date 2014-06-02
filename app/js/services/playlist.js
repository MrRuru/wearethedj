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
    // this.pendingVotes = 0;
    this.upvoting = true;

    var self = this;

    // Optimistic upvote
    // this.bumpBy(score);
    var cancelUser = User.clearVotes(this.id);

    Sync.upvoteTrack(this.id, score, function(res, err){
      self.upvoting = false;

      // Ok
      if(res){
        console.log('response : ', res);
        self.score = self.getScore();
        self.pendingVotes = 0;
        return;
      }
      
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

  Track.prototype.getScore = function(){
    var score = this.score + this.pendingVotes;
    if (this.status === 'new'){
      score += this.pendingVotes;
    }
    return score;
  };

  Track.compare = function(a,b){
    return (b.score - a.score) || (a.created_at - b.created_at);
  };


  // Current tracks, indexed by id
  var Playlist = {};
  Playlist.Track = Track;
  Playlist.tracks = [];
  Playlist.index = {};
  Playlist.playing = {    
    artist: 'C2C',
    title: 'F.U.Y.A'
  };



  // Bootstraping the playlist
  Playlist.bootstrap = function(data){
    // Clear the playlist
    Playlist.tracks = [];
    Playlist.index = {};

    // Trick for entering them progressively
    var allTracks = _.map(data, function(trackOpts){
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

  return Playlist;

});

