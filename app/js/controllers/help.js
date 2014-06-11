
angular.module('app.controllers.help', ['app.services.playlist'])
.controller('HelpCtrl', function($scope, Playlist) {

  $scope.index = 0;

  $scope.track = new Playlist.Track({
    artist: 'C2C',
    title: 'F.U.Y.A',
    score: 42
  });


  $scope.slideHasChanged = function(index){
    console.log(index);

    //global class
    $scope.index = index;

    // Track changes
    if (index == 2){
      $scope.track.status = 'new';
      $scope.track.lastUpvote = 0;
    } else if (index == 3) {
      $scope.track.status = 'dying';
      $scope.track.lastUpvote = 0;
    } else {
      $scope.track.status = '';
    }

  };

});