// Configuration
var appPort     = 14001
  , socketPort  = 3457;


var api = require('./api.js'),
    sockets = require('./websocket_server.js');

api.listen(appPort);
sockets.listen(socketPort);

console.log('Server Running. API on ', appPort, 'and WebSockets on', socketPort);