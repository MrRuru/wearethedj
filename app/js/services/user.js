// ============
// User Service
// ============

angular.module('app.services.user', [])
.factory('User', function($cookieStore){

  var generateUid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
  };

  var uid = $cookieStore.get('uid')

  if (!uid) {
    uid = generateUid();
    console.log('generated uid', uid);
    $cookieStore.put('uid', uid);
  }

  var _votes = 0;
  var _pendingVotes = [];
  var _totalPendingVotes = 0;

  var User = {
    id: uid,

    bootstrap: function(data){
      _votes = data.votes;
      _seenHelp = false;
    },

    seenHelp: false

    // votes: function(){
    //   return _votes - _totalPendingVotes;
    // },

    // useVote: function(trackId){
    //   console.log('using vote on ', trackId);
    //   _pendingVotes[trackId] = _pendingVotes[trackId] || 0;
    //   _pendingVotes[trackId] += 1;
    //   _totalPendingVotes += 1;
    // },

    // clearVotes: function(trackId){
    //   var trackVotes = _pendingVotes[trackId];

    //   _totalPendingVotes = _totalPendingVotes - trackVotes;
    //   _pendingVotes[trackId] = 0;

    //   // Assume votes are cashed, will be corrected via the server anyway
    //   _votes -= trackVotes;

    //   // Send correction callback
    //   return function(){
    //     _votes = _votes + trackVotes;
    //   };
    // },

    // updateUser: function(attrs){
    //   _votes = attrs.votes;
    // }
  };

  return User;

});