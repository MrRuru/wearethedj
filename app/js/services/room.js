// ==================
// Room service (...)
// ==================

angular.module('app.services.room', [])
.factory('Room', function(){

  // var uid = null;
  // DEBUG
  uid = 'test';

  var Room = {
    get: function(){ return uid; },
    set: function(newid){
      uid = newid;
    }
  };

  return Room;
});

