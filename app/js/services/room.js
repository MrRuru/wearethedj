// ==================
// Room service (...)
// ==================

angular.module('app.services.room', ['app.services.sync'])
.factory('Room', function(Sync){

  var uid = null;

  var Room = {
    get: function(){ return uid; },
    set: function(newid){
      uid = newid;
      Sync.setRoom(this);
    }
  };

  return Room;
});

