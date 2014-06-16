// Global : DZ


// The actual deezer player wrapper
var Player = {
  playTrack: function(trackId){
    DZ.player.playTracks([trackId]);
  },

  pause: function(){
    DZ.player.pause();
  },

  resume: function(){
    DZ.player.play();
  }
}

// The page controller
var Controller = {
  
  // Status
  isInitialized: false,
  roomId: null,
  isLoggedIn: false,

  initialized: function(){ return this.isInitialized; },
  roomSet: function(){ return this.roomId !== null; },
  loggedIn: function(){ return this.isLoggedIn; },
  playing: function(){ return Player.playing(); },


  fetchingNext: false,

  init: function(){
    var self = this;

    console.log('initializing');

    DZ.init({
      appId  : '133181',
      channelUrl : ('http://' + window.location.host + '/channel.html'),
      player : {
        container : 'player',
        cover : true,
        width : 1000,
        height : 80,
        playlist: false,
        onload : function(){
          // Watch the track position
          DZ.Event.subscribe('player_position', function(pos){
            self.onPlayerPosition(pos[0]);
          });

          // Update the view
          self.isInitialized = true;
          View.render();

          console.log('initialized');
        }
      }
    });
  },

  setRoom: function(code, onSuccess, onError){

    var self = this;

    // Simulate OK xhr
    setTimeout(function(){

      self.roomId = '1234';
      View.render();

    }, 1000);

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
          View.render();

        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {perms: 'manage_library,delete_library'});
  },

  play: function(){
    // Handle first track : need to be fetched
  },

  pause: function(){
    Player.pause()
  },

  next: function(){

    // Do not destroy the top playlist
    if (this.fetchingNext) { return false; }
    this.fetchingNext = true;

    var self = this;
    $.ajax({
      url: '/room/myroom/top',
      type: 'DELETE',
      success: function(trackId){
        self.setTrack(trackId);
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
      this.next();
    }
  }

};

// The view wrapper
var View = {

  init: function(cb){

    // Store dom elements
    this.joinRoomCont = $('#joinroom, #menu-joinroom');
    this.joinRoomSpinner = $('#joinroom .upvote');
    this.loginCont = $('#login, #menu-login');
    this.playingCont = $('#playing, #menu-playing');

    var self = this;

    // Bind events
    this.loginCont.on('click', function(){
      Controller.login();
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
          alert('Erreur : ' + error);
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

  render: function(){
  
    console.log('rendering');
    var self = this;

    // Handle the different statuses
    if (Controller.loggedIn()) {
      self.loginCont.fadeOut('slow', function(){
        self.playingCont.fadeIn('slow');
      });
      return;
    }

    if (Controller.roomSet()) {
      self.joinRoomCont.fadeOut('slow', function(){
        self.loginCont.fadeIn('slow');
      });
      return;
    }

    if (Controller.initialized()) {
      self.joinRoomCont.fadeIn('slow');
      return;
    };

  }

};



View.init();
Controller.init();
