// =================
// Search controller
// =================

angular.module('app.controllers.login', ['app.services.sync', 'app.services.room'])
.controller('LoginCtrl', function($scope, $location, Sync, Room) {

  $scope.joinRoom = function(){
    var roomName = $scope.room.name;

    Sync.onLoaded(function(){
      // $scope.loading = false;
      // $location.path('/tab/playlist');
    });

    console.log('loading...');
    $scope.loading = true;

    Room.set(roomName);
  };

});