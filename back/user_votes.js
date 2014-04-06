var DB      = require('./lib/database.js'),
    Pubsub  = require('./lib/pubsub.js'),
    _       = require('lodash');

var DEFAULT_BASE = 2; // higher = slower slowdown
var DEFAULT_COEF = 500; // higher = less frequent

var _base = ( parseFloat(process.env.BASE) || DEFAULT_BASE ); // seconds
    _coef = ( parseFloat(process.env.COEF) || DEFAULT_COEF ); // seconds


var _rooms = {};

var delta = function(score){
  return _coef * ( _base + Math.log(score + 1) );
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
  if (user.votes >= 100) {
    return;
  }

  _rooms[user.roomId][user.id] = setTimeout(function(){
    DB.addUserVote(user.roomId, user.id);
  }, delta(user.votes));
};


Pubsub.onNewUser(null, add);
Pubsub.onUpdateUser(null, check);


bootstrap();