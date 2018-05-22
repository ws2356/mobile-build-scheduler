const Bluebird = require('bluebird');
const redis = require('redis');

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
});
Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);


const REDIS_KEY_PREF = appInfo.name;
const BUILD_EXEC_LIST_KEY = `${REDIS_KEY_PREF}:exec_list`;


module.exports = {
  redisClient,
  BUILD_EXEC_LIST_KEY,

  async at(index, listKey) {
    return redisClient.lindexAsync(listKey, index);
  },

  async shift(listKey) {
    return redisClient.lpopAsync(listKey);
  },

  async push({ query, repo }, listKey) {
    const len = await redisClient.lpushAsync(listKey, JSON.stringify({ query, repo }));
    if (len === 1) {
      await redisClient.expire(listKey, config.BUILD_LIST_EXPIRE_TIME);
    }
    return len;
  },

  async all(listKey) {
    const ret = redisClient.lrangeAsync(listKey, 0, -1);
    return ret || [];
  },
};
