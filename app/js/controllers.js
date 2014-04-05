angular.module('playlist.controllers', [])


// A simple controller that fetches a list of data from a service
.controller('PlaylistCtrl', function($scope) {
  $scope.tracks = [
    {
      title: 'Colours',
      artist: 'Chiddy Bang',
      score: 12,
      status: 'down'
    },
    {
      title: 'On Melancholy Hill (Feed Me Remix)',
      artist: 'Gorillaz',
      score: 4
    },
    {
      title: 'Early Morning',
      artist: 'BesNine',
      score: 119,
      pending: 4
    },
    {
      title: 'Nothing Gold (Todd Terje Remix)',
      artist: 'JOAKIM',
      score: 25
    },
    {
      title: 'Colours',
      artist: 'Chiddy Bang',
      score: 12,
      status: 'new'
    },
    {
      title: 'On Melancholy Hill (Feed Me Remix)',
      artist: 'Gorillaz',
      score: 4,
      status: 'new',
      pending: 2
    },
    {
      title: 'Early Morning',
      artist: 'BesNine',
      score: 119
    },
    {
      title: 'Nothing Gold (Todd Terje Remix)',
      artist: 'JOAKIM',
      score: 25,
      status: 'down'
    }
  ];
})

.controller('SearchCtrl', function($scope) {

  $scope.results = [
    {
      title: 'Is this love? (Montmartre Remix)',
      artist: 'Bob Marley'
    },
    {
      title: 'Comme un enfant (Viceroy Remix)',
      artist: 'Yelle',
      status: 'added'
    }
  ]

})

.controller('HelpCtrl', function($scope) {

  

});

