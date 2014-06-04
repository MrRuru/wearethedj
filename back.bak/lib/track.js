var Pubsub = require('./pubsub.js');


// ===========
// Track model
// ===========
// var Track = function(roomId, id){
//   this.id = parseInt(id, 10);
//   this.room = new Room(roomId);
//   this.key = 'watdj:rooms:' + roomId + ':tracks:' + id;
// };

// Track.prototype.get = function() {
//   var self = this;

//   return this.room.trackScore(this.id)
//   .then(function(score){
//     if (!score) { return null; }
//     return hgetall(self.key)
//     .then(function(attrs){
//       if (!attrs) { return null; }
//       return {
//         id: self.id,
//         roomId: self.room.id,
//         score: score,
//         status: attrs.status,
//         artist: attrs.artist,
//         title: attrs.title,
//         created_at: parseInt(attrs.created_at, 10),
//         last_upvote_at: parseInt(attrs.last_upvote_at, 10)
//       };
//     });
//   });
// };

// Track.prototype.create = function(args) {
//   var self = this;

//   // Check existing before
//   return this.get()
//   .then(function(exists){
//     if (!!exists) {
//       return [false, null];
//     }
//     else {
//       var attrs = {
//         title: args.title,
//         artist: args.artist,
//         created_at: Date.now(),
//         last_upvote_at: Date.now(),
//         status: 'new',
//       };
//       var score = 1;

//       return hmset(self.key, attrs)
//       .then(function(){
//         return self.room.addTrack(self.id);
//       })
//       .then(function(){
//         return self.get();
//       })
//       .then(function(attrs){
//         return [true, attrs];
//       });
//     }
//   });
// };

// Track.prototype.setAttr = function(key, value) {
//   var self = this;

//   return this.get()
//   .then(function(trackAttrs){
//     if( !trackAttrs ){
//       return false;
//     }
//     if ( trackAttrs[key] === value ){
//       return false;
//     }
//     else {
//       return hset(self.key, key, value)
//       .then(function(){
//         self.notifyUpdate();
//       })
//       .then(function(){
//         return true;
//       });
//     }
//   });
// };

// Track.prototype.delete = function() {
//   console.log('deleting track', this);
//   var self = this; 

//   return this.room.deleteTrack(this.id);
// };

Track.prototype.score = function() {
  return this.room.trackScore(this.id);
};

Track.prototype.pingLastUpvote = function() {
  var now = Date.now();
  console.log('pinging last upvote', now);
  return hset(this.key, 'last_upvote_at', now).then(function(res){
    console.log('ping upvote ok! : res');

  });
};

Track.prototype.die = function() {
  var self = this;

  // Downvote 1
  return this.get()
  .then(function(attrs){
    if (!attrs) { console.log('already dead'); return false; }

    return self.room.upvote(self.id, -1)
    .then(function(score){
      // Score is 0 : deletion
      if (score <= 0) {
        console.log('score 0, delete');
        return self.delete()
        .then(function(res){
          return Track.notifyDelete(attrs);
        });
      }
      else {
        console.log('score not 0, update');
        return self.notifyUpdate()
        .then(function(){ return true; });
      }
    });
  });
};

Track.prototype.notifyNew = function() {
  return this.get()
  .then(function(trackAttrs){
    return Pubsub.notifyNewTrack(trackAttrs);
  }); 
};

Track.prototype.notifyUpdate = function() {
  return this.get()
  .then(function(trackAttrs){
    return Pubsub.notifyUpdateTrack(trackAttrs);
  }); 
};

Track.notifyDelete = function(trackAttrs) {
  return Pubsub.notifyDeleteTrack(trackAttrs);
};


module.exports = Track;
