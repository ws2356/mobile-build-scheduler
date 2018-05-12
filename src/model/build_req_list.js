const Bluebird = require('bluebird');
const redis = require('redis');

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
});
Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);


const REDIS_KEY_PREF = appInfo.name;
const BUILD_REQ_LIST_KEY = `${REDIS_KEY_PREF}:build_list`;


module.exports = {
  redisClient,
  BUILD_REQ_LIST_KEY,

  async at(index) {
    return redisClient.lindexAsync(BUILD_REQ_LIST_KEY, index);
  },

  async shift() {
    return redisClient.lpopAsync(BUILD_REQ_LIST_KEY);
  },

  async push({ query, repo }) {
    return redisClient.lpushAsync(BUILD_REQ_LIST_KEY, JSON.stringify({ query, repo }));
  },

  async all() {
    const ret = redisClient.lrangeAsync(BUILD_REQ_LIST_KEY, 0, -1);
    return ret || [];
  },
};
