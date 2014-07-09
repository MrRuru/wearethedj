// =================
// Search controller
// =================

angular.module('app.controllers.search', ['app.services.sync', 'app.controllers.playlist', 'ionic'])
.controller('SearchCtrl', function($scope, $timeout, Sync, Playlist, $ionicModal) {

  $scope.search = {query: ''};
  $scope.searching = false;
  
  $scope.clearSearch = function(){
    $scope.searching = false;
    $scope.search = {query: ''};
    $scope.results = null;
  };

  $scope.doSearch = function(){
    console.log('searching', $scope.search.query, '.');

    if ($scope.search.query == '') {
      return;
    }

    $scope.firstView = false;
    $scope.searching = true;

    $scope.results = [];
    DZ.api('/search', 'GET', {q: $scope.search.query, order: 'RANKING'}, function(res){
      $scope.searching = false;
      // $ionicLoading.hide();

      var results = _.filter(res.data, function(result){
        return !Playlist.hasTrack(result.id);
      }).slice(0,10);

      var gradualAppend = function(){
        result = results.shift();
        if (!!result) {
          $scope.results.push(result);
          $timeout(gradualAppend, 100);
        }
      }

      gradualAppend();

      console.log('results are', res.data);
    });
  };

  $scope.addTrack = function(track){
    if (track.status){
      return;
    }

    track.status = 'adding';

    Sync.addTrack(track, function(success, res){
      if(success){
        console.log('added');
        track.status = 'added';
        $timeout(function(){
          $scope.clearSearch();
          $scope.closeModal();
        }, 600);
      }
      else {
        console.log('Error adding track : ', res);
        track.status = null;
      }
    });
  };

});
