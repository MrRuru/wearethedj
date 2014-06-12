
angular.module('app.controllers.help', ['app.services.playlist'])
.controller('HelpCtrl', function($scope, $timeout, Playlist) {

  $scope.index = 0;

  $scope.track = new Playlist.Track({
    artist: 'C2C',
    title: 'F.U.Y.A',
    score: 42
  });

  $scope.linkToNextPage = false;

  $timeout(function(){
    $scope.linkToNextPage = true;
  }, 1);


  // Dying interval
  var interval = null;

  $scope.track.upvoteOld = $scope.track.upvote;
  $scope.track.upvote = function(){
    if (this.status == 'dying') {
      this.status = '';
    }
    
    $scope.linkToNextPage = true;
    clearInterval(interval);

    if (this.status == 'new') {
      this.bumpBy(2);
    } else {
      this.bumpBy(1);
    }

    this.lastUpvote = Date.now();

    // $scope.track.upvoteOld();
  };


  $scope.slideHasChanged = function(index){
    console.log(index);

    $scope.linkToNextPage = false;

    // Global class
    $scope.index = index;

    // Dying track
    if (index == 3) {
      interval = setInterval(function(){

        if ($scope.track.score == 0){ return; }

        $scope.$apply(function(){
          $scope.track.bumpBy(-1);
        });

      }, 1000);
    }
    else {
      clearInterval(interval);
    }

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

    // Homepage: display swipe
    if (index == 0) {

      $timeout(function(){
        $scope.linkToNextPage = true;
      }, 1);

    }

  };

});