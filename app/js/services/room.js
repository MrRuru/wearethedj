// ==================
// Room service (...)
// ==================

angular.module('app.services.room', [])
.factory('Room', function($cookieStore){

  var uid = $cookieStore.get('room-name')

  var Room = {
    get: function(){ return uid; },
    set: function(newid){
      $cookieStore.put('room-name', newid);
      uid = newid;
    }
  };

  return Room;
});

