

// // ==========
// // User model
// // ==========
// var User = function(roomId, id){
//   this.room = new Room(roomId);
//   this.id = id;
//   this.key = 'watdj:rooms:' + roomId + ':users:' + id;
// };

// User.prototype.get = function() {
//   var self = this;

//   return get(this.key)
//   .then(function(votes){
//     if (!votes){
//       return null;
//     }
//     else{
//       return {
//         id: self.id,
//         roomId: self.room.id,
//         votes: parseInt(votes, 10)
//       }
//     }
//   });
// };

// User.prototype.findOrCreate = function() {
//   var self = this;

//   return this.get()
//   .then(function(attrs){
//     if(attrs){
//       return [false, null];
//     }
//     else{
//       return self.create()
//       .then(function(attrs){
//         return [true, attrs];
//       });
//     }
//   });
// };

// User.prototype.create = function() {
//   var self = this;

//   var votes = 1;
//   return set(this.key, votes)
//   .then(function(){
//     return self.get();
//   });
// };

// User.prototype.notifyNew = function() {
//   var self = this;

//   this.get()
//   .then(function(userAttrs){
//     Pubsub.notifyNewUser(userAttrs);    
//   });
// };

// User.prototype.notifyUpdate = function() {
//   return this.get()
//   .then(function(userAttrs){
//     Pubsub.notifyUpdateUser(userAttrs);
//   });
// };

// User.prototype.removeVotes = function(score) {
//   var self = this;

//   return decrby(this.key, score)
//   .then(function(){
//     return true;
//   });
// };

// User.prototype.addVote = function() {
//   var self = this;
//   console.log('addingvote');
//   return incr(this.key)
//   .then(function(){
//     console.log('incremented');
//     return self.notifyUpdate();
//   })
//   .then(function(){
//     console.log('notified');
//     return self.get();
//   });
// };

// module.exports = User;
