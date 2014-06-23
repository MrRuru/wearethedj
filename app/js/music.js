// Global : DZ


// The actual deezer player wrapper
var Player = {
  loadTrack: function(trackId){
    DZ.player.playTracks([trackId]);
  },

  pause: function(){
    DZ.player.pause();
  },

  play: function(){
    DZ.player.play();
  }
}

// The page controller
var Controller = {
  
  // Status
  isInitialized: false,
  roomId: null,
  isLoggedIn: false,
  currentTrack: null,

  initialized: function(){ return this.isInitialized; },
  roomSet: function(){ return this.roomId !== null; },
  loggedIn: function(){ return this.isLoggedIn; },
  playing: function(){ return Player.playing(); },


  fetchingNext: false,

  init: function(){
    var self = this;

    console.log('initializing controller');

    DZ.init({
      appId  : '133181',
      channelUrl : ('http://' + window.location.host + '/channel.html'),
      player : {
        playlist: false,
        onload : function(){
          // Watch the track position
          DZ.Event.subscribe('player_position', function(pos){
            self.onPlayerPosition(pos[0]);
          });

          // Update the view
          self.isInitialized = true;
          View.showLanding();
        }
      }
    });
  },

  setRoom: function(code, onSuccess, onError){

    var self = this;

    $.ajax({
      url: 'http://api.poll.dance/room',
      data: {
        code: code
      },
      dataType: 'json',
      success: function(room){
        self.roomId = room.id;
        View.showLogin();
        onSuccess();
      },
      error: function(){
        onError('Invalid code');
      }
    });

  },

  login: function(){
    console.log('logging in...');
    var self = this;

    DZ.login(function(response) {
      if (response.authResponse) {
        console.log('Welcome!  Fetching your information.... ');
        DZ.api('/user/me', function(response) {
          console.log('Good to see you, ' + response.name + '.');

          // Update the view
          self.isLoggedIn = true;
          View.showPlayer();

        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {perms: 'manage_library,delete_library'});
  },

  play: function(){
    if (!this.currentTrack) {
      this.loadNextTrack();
    }
    else{
      Player.play();
      View.setPlaying();
    }
  },

  pause: function(){
    Player.pause();
    View.setPaused();
  },

  loadNextTrack: function(){

    // Do not destroy the top playlist
    if (this.fetchingNext) { return false; }
    this.fetchingNext = true;

    var self = this;
    $.ajax({
      url: 'http://api.poll.dance/room/' + this.roomId + '/top',
      type: 'DELETE',
      success: function(track){
        Player.loadTrack(track.id);
        self.currentTrack = track;
        View.updateTrack(track);
        View.setPlaying();
      }
    });
  },

  // Handle track chaining
  onPlayerPosition: function(position){
    // Pos > 0 : track started, no more fetching next one
    if (position > 0) { 
      this.fetchingNext = false;
      return;
    }

    // Pos == 0 : it's the end
    if (position === 0) {
      this.loadNextTrack();
    }
  }

};

// The view wrapper
var View = {

  init: function(cb){

    console.log('initializing view');

    // Store dom elements
    this.joinRoomCont = $('#joinroom, #menu-joinroom');
    this.joinRoomSpinner = $('#joinroom .upvote');
    this.loginCont = $('#login, #menu-login');
    this.playingCont = $('#playing, #menu-playing');
    this.currentTrackCont = $('#playing .current');


    var self = this;

    // Bind events
    this.loginCont.find('a').on('click', function(){
      Controller.login();
    });

    this.playingCont.find('#play').on('click', function(){
      Controller.play();      
    });

    this.playingCont.find('#pause').on('click', function(){
      Controller.pause();      
    });

    this.playingCont.find('#next').on('click', function(){
      Controller.loadNextTrack();
    });

    this.joinRoomCont.on('click', function(){
      self.joinRoomCont.addClass('focus');
      self.joinRoomSpinner.removeClass('muted');
    });

    this.joinRoomCont.find('form').on('submit', function(e){
      e.preventDefault();
      self.joinRoomSpinner.addClass('spin');

      // Store the code
      var code = self.joinRoomCont.find('input').val();

      Controller.setRoom(
        code,

        // Success
        function(){
          self.joinRoomSpinner.removeClass('spin');
          $('.code').html(code);
        },

        // Error
        function(error){
          self.joinRoomSpinner.removeClass('spin');
          alert('Error : ' + error);
        }
      );
    });


    // Hide them
    this.joinRoomCont.hide();
    this.loginCont.hide();
    this.playingCont.hide();

    // Show the container
    $('#container').show()
  },

  showLanding: function(){
    var self = this;
    self.joinRoomCont.fadeIn('slow');
    return;
  },

  showLogin: function(){
    var self = this;
    self.joinRoomCont.fadeOut('slow', function(){
      self.loginCont.fadeIn('slow');
    });
  },

  showPlayer: function(){
    var self = this;
    self.playingCont.find('#pause').hide();
    self.loginCont.fadeOut('slow', function(){
      self.playingCont.fadeIn('slow');
    });
  },

  updateTrack: function(track){
    this.currentTrackCont.find('.artist').html(track.artist);
    this.currentTrackCont.find('.title').html(track.title);
  },

  setPlaying: function(){
    this.playingCont.find('#play').hide();
    this.playingCont.find('#pause').show();
  },

  setPaused: function(){
    this.playingCont.find('#pause').hide();
    this.playingCont.find('#play').show();
  }

};



View.init();
Controller.init();
