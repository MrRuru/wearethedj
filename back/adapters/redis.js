// Helper for redis calls
// Handles wrapping methods in promise calls, and common keys
var Q       = require('q'),
    redis   = require('redis'),
    client  = redis.createClient();

// The exported module
var Redis;

Redis.set = Q.nbind(client.set, client);
Redis.get = Q.nbind(client.get, client);
Redis.zrevrangebyscore = Q.nbind(client.zrevrangebyscore, client);
Redis.zscore = Q.nbind(client.zscore, client);
Redis.zincrby = Q.nbind(client.zincrby, client);
Redis.zadd = Q.nbind(client.zadd, client);
Redis.hset = Q.nbind(client.hset, client);
Redis.hmset = Q.nbind(client.hmset, client);
Redis.hgetall = Q.nbind(client.hgetall, client);
Redis.decrby = Q.nbind(client.decrby, client);
Redis.keys = Q.nbind(client.keys, client);
Redis.del = Q.nbind(client.del, client);
Redis.zrem = Q.nbind(client.zrem, client);
Redis.incr = Q.nbind(client.incr, client);


// The common used keys
Redis.playlist = function (roomId) { return 'pldnc:rooms:' + roomId + ':playlist'; }
Redis.track = function (roomId, trackId) { return 'pldnc:rooms' + roomId + ':tracks:' + trackId; }


// Exporting
module.exports = Redis;
