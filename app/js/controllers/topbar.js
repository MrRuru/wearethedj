angular.module('app.controllers.topbar', ['ionic'])
.controller('TopbarCtrl', function($scope, $state, $ionicModal) {

  $scope.show = function(){
    // console.log('checking if shown. state is', $state.current);
    return !!$state.current.showTopbar;
  };

  $scope.showSearch = function(){
    console.log('showing search');
    $scope.modal.show();
  };

  $scope.hideSearch = function(){
    console.log('hiding search');
    $scope.modal.hide();
  };


  $ionicModal.fromTemplateUrl('templates/search.html', {
    scope: $scope,
    animation: 'fade-in'
  }).then(function(modal) {
    $scope.modal = modal;
  });

});