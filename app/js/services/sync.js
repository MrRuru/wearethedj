// ============
// Sync service
// ============

angular.module('app.services.sync', [])
.factory('Sync', function($rootScope, $socket){

  // Link to bound services
  var User, Room, Playlist, onLoaded;

  // Are the dependencies linked, to send the socket connection
  var checkLinkingStatus = function(){
    if (User && Room && Playlist) {
      console.log('SYNC - launching bootstrap');
      setupWatchers();
      $socket.emit('bootstrap', {userId: User.id, roomId: Room.get()});
    }
  };

  // Is the data loaded ?
  var loadedCheck = {
    tracks: false,
    user: false
  };

  var checkLoadedStatus = function(){
    console.log('checking if loaded');
    if (loadedCheck.tracks && loadedCheck.user) {
      console.log('loaded!!');
      onLoaded();
    }
  };


  // Watchers
  var setupWatchers = function(){
    $socket.on('bootstrapPlaylist', function(data){
      console.log('got playlist', data);
      Playlist.bootstrap(data);
      loadedCheck.tracks = true;
      checkLoadedStatus();
    });

    $socket.on('bootstrapUser', function(data){
      User.bootstrap(data);
      loadedCheck.user = true;
      checkLoadedStatus();
    });

    $socket.on('newTrack', Playlist.newTrack);
    $socket.on('updateTrack', Playlist.updateTrack);
    $socket.on('playingTrack', Playlist.playingTrack);
    $socket.on('deleteTrack', Playlist.deleteTrack);

    $socket.on('updateUser', User.updateUser);
  };


  return {

    // Dependencies manual linking
    setUser: function(userService){
      console.log('linked user service');
      User = userService;
      checkLinkingStatus();
    },

    setRoom: function(roomService){
      console.log('linked room service');
      Room = roomService;
      checkLinkingStatus();
    },

    setPlaylist: function(playlistService){
      console.log('linked playlist service');
      Playlist = playlistService;
      checkLinkingStatus();
    },

    // Callback when ready
    onLoaded: function(cb){ onLoaded = cb; },


    // Accessors to send data
    addTrack: function(track, cb){
      $socket.emit('addTrack', {id: track.id, artist: track.artist.name, title: track.title}, cb);
    },

    upvoteTrack: function(trackId, score, cb){
      $socket.emit('upvote', {trackId: trackId, score: score}, cb);
    }

  };

});