// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'ngAnimate', 'ngCookies', 'app.controllers', 'app.services', 'app.directives.upvote'])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('playlist', {
      url: '/playlist',
      controller: 'PlaylistCtrl',
      templateUrl: 'templates/playlist.html'
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

})

.directive('autoHideKeyboard', function () {
    return function (scope, element, attr) {
      var textFields = element.find('input');
       
      element.bind('submit', function() {
          console.log('form was submitted');
          textFields[0].blur();
      });
    }
})

.run(function(User, Playlist, Room, Sync){

  Sync.setRoom(Room);
  Sync.setPlaylist(Playlist);
  Sync.setUser(User);

  Sync.load();

});