// ===================
// Playlist controller
// ===================

angular.module('app.controllers.playlist', ['app.services.playlist'])
.filter('orderTracks', function(Playlist) {
  return function(tracks) {
    tracks.sort(Playlist.Track.compare);
    return tracks;
  };
})
.controller('PlaylistCtrl', function($scope, $timeout, Playlist, User, $filter) {

  // Redirect if no room (todo)

  $scope.playlist = Playlist;

});