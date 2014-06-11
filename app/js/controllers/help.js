
angular.module('app.controllers.help', [])
.controller('HelpCtrl', function($scope) {

  $scope.index = 0;

  $scope.slideHasChanged = function(index){
    console.log(index);
    $scope.index = index;
  };

  $scope.track = {
    artist: 'C2C',
    title: 'F.U.Y.A'
  }

});