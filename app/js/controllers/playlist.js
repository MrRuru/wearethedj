// ===================
// Playlist controller
// ===================

angular.module('app.controllers.playlist', ['app.services.playlist'])
.filter('orderTracks', function() {
  return function(tracks) {
    res = _.values(tracks);
    res.sort(function(a, b){
      if (a.score === b.score) {
        return a.created_at > b.created_at;
      }
      else {
        return a.score < b.score;
      }
    });
    return res;
  };
})
.controller('PlaylistCtrl', function($scope, $timeout, Playlist, User, $filter) {

  // For watching changes...
  $scope.playlist = Playlist.tracks;
  $scope.playing = Playlist.playing;

  $scope.votes = User.votes;

  // Watch the playlist changes
  $scope.Playlist = Playlist;
  $scope.$watchCollection('Playlist.tracks', function(){
    console.log('updating tracks');

    if (!Playlist.loadedOnce && _.values(Playlist.tracks).length > 0){
      // Gradual entering, only the first time
      var playlist = $filter('orderTracks')(Playlist.tracks);

      var newTrack;
      $scope.playlist = [];
      var gradualAppend = function(){
        newTrack = playlist.shift();
        if (!!newTrack) {
          $scope.playlist[newTrack.id] = newTrack;
          $timeout(gradualAppend, 100);
        }
      }
      gradualAppend();
      Playlist.loadedOnce = true;
    }
    else {
      $scope.playlist = _.values(Playlist.tracks);
    }
  });

  $scope.$watch('Playlist.playing', function(playing){
    if ( !playing || !playing.artist || !playing.title ) {
      $scope.playing = ' - ';
    }
    else {
      $scope.playing = playing.artist + '-' + playing.title;
    }
  });

});