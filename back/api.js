// Handles API calls
var  express  = require('express')
   , Playlist = require('./playlist.js')
   , TrackTTL = require('./track_expirer.js')
   , api      = express();



// API : Pop the top track
api.delete('/room/:roomId/top', function(req, res){

  Q.spawn(function* () {

    try{
      var roomId = req.params.roomId;    
      var playlist = yield Playlist.find(roomId);
      var track = yield playlist.popTopTrack();

      yield TrackTTL.deleteTrack(track.id);
      res.send(track.id);
    }
    catch (err) {
      res.send(500, err);
    }

  });

});


module.exports = api;