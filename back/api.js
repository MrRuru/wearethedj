// Handles API calls
var  express      = require('express')
   , Q            = require('q')
   , Room         = require('./models/room.js')
   , Playlist     = require('./playlist.js')
   , TrackExpirer = require('./track_expirer.js')
   , Sockets      = require('./sockets.js')
   , uid          = require('./uid.js')
   , api          = express();

api.use(express.bodyParser());


// API : Create a new room
api.post('/room', function(req, res){

  Q.spawn( function* () {

    try{
      var code = req.body.code;
      if (!code) { res.send(422, 'Missing `code` parameter.'); return; }

      var existingRoom = yield Room.findByCode(code);
      if( !!existingRoom) { res.send(422, 'Code already taken.'); return; }

      var room = yield Room.create(code);
      res.send(201, room.attrs);
    }
    catch (err) {
      // TODO : log
      console.log('error', err);
      res.send(500, 'Server Error : ' + err.message);
    }

  });

});


// API : Get a room by code
api.get('/room', function(req, res){

  Q.spawn( function* () {

    try{
      var code = req.query.code;
      if (!code) { res.send(422, 'Missing `code` parameter.'); return; }

      var room = yield Room.findByCode(code);
      if (!room) { res.send(404, null); return; }

      res.send(200, room.attrs);
    }
    catch (err) {
      console.log('error', err);
      res.send(500, 'Server Error : ' + err.message);
    }

  });

});

// API : Pop the top track
api.delete('/room/:roomId/top', function(req, res){

  Q.spawn(function* () {

    try{
      var roomId = req.params.roomId;
      var playlist = yield Playlist.find(roomId);
      var track = yield playlist.popTopTrack();

      if (!track) { res.send(404); return; }

      yield TrackExpirer.deleteTrack(track.id);
      Sockets.broadcastRoom(roomId, 'playingTrack', track.attrs);
      Sockets.broadcastRoom(roomId, 'deleteTrack', track.attrs);

      res.send(track.attrs);
    }
    catch (err) {
      // TODO : log
      console.log('error', err);
      res.send(500, err);
    }

  });

});


module.exports = api;