// =================
// Search controller
// =================

angular.module('app.controllers.login', ['app.services.sync', 'app.services.room'])
.controller('LoginCtrl', function($scope, $location, Sync, Room) {

  $scope.joinRoom = function(){
    var roomName = $scope.room.name;

    $scope.loading = true;

    Room.set(roomName);

    Sync.load(function(){
      $scope.loading = false;
      $location.path('/tab/playlist');
    });
  };

});