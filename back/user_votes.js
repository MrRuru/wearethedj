var DB      = require('./lib/database.js'),
    Pubsub  = require('./lib/pubsub.js'),
    _       = require('lodash');


var MAX_SCORE = 20;
var DELAY = 15; // seconds

var _rooms = {};

var delta = function(score){
  return DELAY * 1000;
};


var bootstrap = function(){
  console.log('bootstraping');

  DB.getAllUsers().then(function(users){
    _.each(users, add);
  })
  .done();
};

var add = function(user){
  console.log('adding', user);
  // Build room if needed
  if (!_.has(_rooms, user.roomId)) {
    console.log('building room', user.roomId);
    _rooms[user.roomId] = {};
  }

  check(user);
};

var check = function(user){
  clearTimeout(_rooms[user.roomId][user.id]);

  // Check if score too high
  if (user.votes >= MAX_SCORE) {
    return;
  }

  _rooms[user.roomId][user.id] = setTimeout(function(){
    DB.addUserVote(user.roomId, user.id);
  }, delta(user.votes));
};


Pubsub.onNewUser(null, add);
Pubsub.onUpdateUser(null, check);


bootstrap();