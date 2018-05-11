const Bluebird = require('bluebird');
const md5 = require('md5');
const redis = require('redis');

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
});
Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);


const REDIS_KEY_PREF = appInfo.name;
const HASH_KEY_SET = `${REDIS_KEY_PREF}:hash:keys`;
const HASH_NAMESPACE = `${REDIS_KEY_PREF}:hash`;

function hash(str) {
  return `${HASH_NAMESPACE}:${md5(str)}`;
}

module.exports = {
  async set(key, value = {}, getKey = v => v) {
    const valueStr = JSON.stringify(value);
    const hashKey = hash(key);
    try {
      await redisClient.sadd(HASH_KEY_SET, key);
      const llen = await redisClient.llenAsync(hashKey);
      for (let ii = 0; ii < llen; ii += 1) {
        const v = await redisClient.lindexAsync(hashKey, ii);
        if (v === valueStr) {
          return true;
        } else if (getKey(v) === getKey(valueStr)) {
          return redisClient.lsetAsync(hashKey, ii, valueStr);
        }
      }
      return redisClient.lpushAsync(hashKey, valueStr);
    } catch (e) {
      console.error('failed to set key for value: ', key, value);
      throw e;
    }
  },

  async get(key) {
    const hashKey = hash(key);
    return redisClient.lrangeAsync(hashKey, 0, -1);
  },

  async remove(key, value) {
    const valueStr = JSON.stringify(value);
    const hashKey = hash(key);
    return redisClient.lremAsync(hashKey, 1, valueStr);
  },

  async allKeys() {
    return redisClient.smembersAsync(HASH_KEY_SET);
  },
};
