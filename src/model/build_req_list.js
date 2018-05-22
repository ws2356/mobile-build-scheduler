const Bluebird = require('bluebird');
const redis = require('redis');

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
});
Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);


const REDIS_KEY_PREF = appInfo.name;
const BUILD_REQ_LIST_KEY = `${REDIS_KEY_PREF}:build_list`;
const BUILD_EXEC_LIST_KEY = `${REDIS_KEY_PREF}:exec_list`;


module.exports = {
  redisClient,
  BUILD_REQ_LIST_KEY,
  BUILD_EXEC_LIST_KEY,

  async at(index, listKey = BUILD_REQ_LIST_KEY) {
    return redisClient.lindexAsync(listKey, index);
  },

  async shift(listKey = BUILD_REQ_LIST_KEY) {
    return redisClient.lpopAsync(listKey);
  },

  async push({ query, repo }, listKey = BUILD_REQ_LIST_KEY) {
    return redisClient.lpushAsync(listKey, JSON.stringify({ query, repo }));
  },

  async all(listKey = BUILD_REQ_LIST_KEY) {
    const ret = redisClient.lrangeAsync(listKey, 0, -1);
    return ret || [];
  },
};
