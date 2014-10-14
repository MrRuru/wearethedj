var fs              = require('fs'),
    nodemailer      = require('nodemailer'),
    directTransport = require('nodemailer-direct-transport');//, // default config
//    Sockets = require('./sockets');

var Logger = {};

var mailer = nodemailer.createTransport(directTransport());

var log = function(room, tag, info){
  var logFile = '../log/' + room.code + '.log';

  var data = '\n' + (new Date()).toISOString() + ' | ' + tag + ' | ' + JSON.stringify(info);
  fs.appendFile(logFile, data);
};


Logger.roomCreated = function(room){
  log(room, 'CREATED', {id: room.id, code: room.code});

  mailer.sendMail({
    from: 'info@poll.dance',
    to:   'david.ruyer@gmail.com',
    subject: ('New poll.dance party : ' + room.code),
    text: ''
  });
};

Logger.trackPlayed = function(room, track){
  log(room, 'PLAYED', {
    score: track.score,
    title: track.title,
    artist: track.artist,
    people: Sockets.loggedInCount(room.id)
  });
};

module.exports = Logger;