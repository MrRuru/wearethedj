// ============
// Sync service
// ============

angular.module('app.services.sync', [])
.factory('Sync', function($rootScope, $socket){

  // Link to bound services
  var User, Room, Playlist, onLoaded;

  var onLoadedCb = null;
  var watchersOk = false;

  // Watchers
  var setupWatchers = function(){
    if (watchersOk) { return; }

    $socket.on('bootstrap', function(data){
      console.log('got playlist', data);
      Playlist.bootstrap(data);
      loaded = true;
      if (_.isFunction(onLoadedCb)) {
        onLoadedCb.call();
      }
    });

    $socket.on('newTrack', Playlist.newTrack);
    $socket.on('updateTrack', Playlist.updateTrack);
    $socket.on('playingTrack', Playlist.playingTrack);
    $socket.on('deleteTrack', Playlist.deleteTrack);

    // $socket.on('updateUser', User.updateUser);

    watchersOk = true;
  };


  return {

    // Dependencies manual linking
    setUser: function(userService){
      console.log('linked user service');
      User = userService;
    },

    setRoom: function(roomService){
      console.log('linked room service');
      Room = roomService;
    },

    setPlaylist: function(playlistService){
      console.log('linked playlist service');
      Playlist = playlistService;
    },

    load: function(cb){
      onLoadedCb = cb;
      console.log('loading');
      if (!Room.get()){
        return;
      }
      
      console.log('SYNC - launching bootstrap');
      setupWatchers();
      $socket.emit('joinRoom', {userId: User.id, roomId: Room.get()});
    },

    reload: function(){
      $socket.emit('joinRoom', {userId: User.id, roomId: Room.get()});
    },

    // Accessors to send data
    addTrack: function(track, cb){
      $socket.emit('addTrack', {id: track.id, artist: track.artist.name, title: track.title}, cb);
    },

    upvoteTrack: function(trackId, cb){
      $socket.emit('upvote', {trackId: trackId}, cb);
    }

  };

});