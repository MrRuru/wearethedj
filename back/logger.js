var winston = require('winston'),
    mailer  = require('nodemailer').createTransport(), // default config
    Sockets = require('./sockets');

var Logger = {};

var getLogger = function(room){
  var logger = winston.loggers.get(room.code);

  if (logger){
    return logger;
  }
  else {
    winston.loggers.add(room.code, file: { 'log/' + room.code + '.log' }});
    return winston.loggers.get(room.code);    
  }
};


Logger.roomCreated = function(room){
  var logger = getLogger(room);

  logger.info('created', {
    id: room.id,
    code: room.code
  });

  mailer.sendMail({
    from: 'info@poll.dance',
    to:   'david.ruyer@gmail.com',
    subject: ('New poll.dance party : ' + room.code)
  });
};

Logger.trackPlayed = function(room, track){
  var logger = getLogger(room);
  logger.info('play', {
    score: track.score,
    title: track.title,
    artist: track.artist,
    people: Sockets.loggedInCount(room.id)
  });
};

module.exports = Logger;