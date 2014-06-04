
// // ==========
// // Room model
// // ==========
// var Room = function(id){
//   this.id = id;
//   this.playlistKey = 'watdj:rooms:' + id + ':playlist';
// };

Room.prototype.tracks = function() {
  var self = this;

  return this.trackIds()
  .then(function(trackIds){
    return Q.all(_.map(trackIds, function(trackId){
      var track = new Track(self.id, trackId);
      return track.get();
    }));
  })
  .then(function(trackWithDetails){
    return _.compact(trackWithDetails);
  });
};

// Room.prototype.trackIds = function(first_argument) {
//   return zrevrangebyscore(this.playlistKey, '+inf', 0, 'withscores')
//   .then(function(raw_res){
//     var ids = [];
//     for (var i = 0 ; i < (raw_res.length/2) ; i++) {
//       ids.push(raw_res[2*i]);
//     }
//     return ids;
//   });
// };

// Room.prototype.trackScore = function(trackId) {
//   return zscore(this.playlistKey, trackId)
//   .then(function(res){
//     return parseInt(res);
//   });
// };

// Room.prototype.addTrack = function(trackId) {
//   return zadd(this.playlistKey, 1, trackId)
// };

// Room.prototype.upvote = function(trackId, score) {
//   return zincrby(this.playlistKey, score, trackId)
//   .then(function(score){
//     return parseInt(score, 10);
//   });
// };

// Room.prototype.deleteTrack = function(trackId) {
//   console.log('deleting track from playlist');
//   return zrem(this.key, trackId)
//   .then(function(){
//     console.log('deleted track from playlist');
//     return true;
//   });
// };

module.exports = Room;
