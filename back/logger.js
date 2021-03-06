var fs              = require('fs'),
    nodemailer      = require('nodemailer'),
    directTransport = require('nodemailer-direct-transport');

var Logger = {};

var mailer = nodemailer.createTransport(directTransport());

var log = function(room, tag, info){
  var logFile = '../log/' + room.code + '.log';

  var data = (new Date()).toISOString() + ' | ' + tag + ' | ' + JSON.stringify(info) + '\n';
  fs.appendFile(logFile, data);
};


Logger.roomCreated = function(room){
  log(room, 'LAUNCHED', {id: room.id, code: room.code});

  mailer.sendMail({
    from: 'info@poll.dance',
    to:   'david.ruyer@gmail.com',
    subject: ('New poll.dance party : ' + room.code),
    text: ''
  });
};

Logger.trackPlayed = function(room, track, loggedInCount){
  log(room, 'PLAYED', {
    score: track.score,
    title: track.title,
    artist: track.artist,
    people: loggedInCount
  });
};

module.exports = Logger;