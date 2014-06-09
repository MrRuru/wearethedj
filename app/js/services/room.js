// ==================
// Room service (...)
// ==================

angular.module('app.services.room', [])
.factory('Room', function($cookieStore, $http){

  var uid = $cookieStore.get('roomId')

  var Room = {};

  Room.get = function(){ return uid; };

  Room.set = function(newid){
    $cookieStore.put('roomId', newid);
    uid = newid;
  };

  Room.find = function(code){
    return $http.get('/room', {
      params: {
        code: code
      } 
    })
    .then(function(res){
      if (!res.data) {
        return null;
      }
      else {
        return res.data.id;
      }
    });
  };

  return Room;
});

