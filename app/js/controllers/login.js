// =================
// Search controller
// =================

angular.module('app.controllers.login', ['app.services.sync', 'app.services.room'])
.controller('LoginCtrl', function($scope, $state, Sync, Room) {

  $scope.closeModal = function(){
    $scope.modal = null;
  };


  $scope.joinRoom = function(){
    var roomName = $scope.room.code;

    $scope.error = '';
    $scope.loading = true;

    Room.find(roomName).then(function(roomId){

      if (!roomId) { 
        $scope.loading = false;
        $scope.error = "This is not a valid code.";
        return;
      }

      console.log('got room', roomId);
      Room.set(roomId);

      Sync.load(function(){
        $scope.loading = false;
        $state.go('playlist');
      });

    }, function(response){

      if (response.status === 404) {
        $scope.error = "Sorry, no party was found with this code. Please try again.";
        $scope.room.code = '';
      }
      else{
        console.log('ERROR : ', reason);
        $scope.error = "An error happened, sorry.";
      }

      $scope.loading = false;

    });

  };

});