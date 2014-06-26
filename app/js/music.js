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

  setRoom: function(code, onSuccess, onConflict, onError){

    var self = this;

    $.ajax({
      url: 'http://app.poll.dance/room',
      method: 'POST',
      data: {
        code: code
      },
      dataType: 'json',
      success: function(room){
        self.roomId = room.id;
        View.showLogin();
        onSuccess();
      },
      error: function(res){
        console.log(res);

        // 409 conflict : propose to use the room anyway
        if (res.status === 409) {
          self.roomId = res.responseJSON.id;
          onConflict();
          return;
        }

        onError('An error happened : ' + res.responseText);
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
      url: 'http://app.poll.dance/room/' + this.roomId + '/top',
      type: 'DELETE',
      success: function(track){
        Player.loadTrack(track.id);
        self.currentTrack = track;
        View.updateTrack(track);
        View.setPlaying();
      },
      error: function(res){
        if (res.status === 404) { 
          alert('The playlist is empty :(  Follow the instructions on the right to add some tracks and try again.')
        }
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
    this.conflictCont = $('#conflict');

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

    this.playingCont.find('#app_link').on('click', function(e){
      e.preventDefault();
      window.open($(this).attr('href'), 'poll.dance', 'scrollbars=yes,width=640,height=960');
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

        // Conflict
        function(){
          self.conflictCont.fadeIn('slow');          
        },

        // Error
        function(error){
          self.joinRoomSpinner.removeClass('spin');
          alert('Error : ' + error);
        }
      );
    });

    $('#choose-other-code').on('click', function(){
      $('#conflict').hide();
      $('#access_code').val(null).focus();
    });

    $('#continue-with-code').on('click', function(){
      var code = $('#access_code').val();
      $('.code').html(code);
      View.showLogin();
    });


    // Prepare the hidden elements
    this.playingCont.find('#pause').hide();
    this.conflictCont.hide();

    // Show the container
    $('#container').show()
  },

  showLanding: function(){
    $('.step').removeClass('active');
    $('.step-room-login').addClass('active');
  },

  showLogin: function(){
    $('.step').removeClass('active');
    $('.step-deezer-login').addClass('active');
  },

  showPlayer: function(){
    $('.step').removeClass('active');
    $('.step-player').addClass('active');
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
