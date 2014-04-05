// ==================
// Room service (...)
// ==================

angular.module('app.services.room', ['app.services.sync'])
.factory('Room', function(Sync){

  var uid = 'myroom';

  var Room = {
    id: uid
  };

  Sync.setRoom(Room);
  return Room;

});

