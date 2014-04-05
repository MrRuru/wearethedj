// =================
// Search controller
// =================

angular.module('app.controllers.search', ['app.services.sync'])
.controller('SearchCtrl', function($scope, $timeout, Sync) {

  $scope.search = {query: ''};
  $scope.searching = false;
  $scope.firstView = true;

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

      var results = res.data.slice(0,10);

      var result;
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
    track.status = 'adding';

    Sync.addTrack(track, function(){
      track.status = 'added';
    });
  };

});
