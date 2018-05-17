const {
  redisClient,
  shift,
  at,
} = require('../../model/build_req_list');
const { BUILD_REQ_LIST_MAINTAIN_KEY } = require('./lock_key');

const {
  SWEEP_INTERVAL = 3600000,
  STALE_DURATION = 86400000,
} = config;


async function maintain() {
  const now = Date.now();
  try {
    while (true) {
      const req = await at(0);
      if (!req) {
        break;
      }
      const { repo: { created_at: createdAt } } = JSON.parse(req);
      if (now - createdAt > STALE_DURATION) {
        console.log('sweep: stale remove');
        await shift();
      } else {
        console.log('sweep: not stale, stop sweep');
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = async function sweep() {
  if (APP.status === 'closing') {
    return;
  }
  const ok = await redisClient.setnxAsync(BUILD_REQ_LIST_MAINTAIN_KEY, APP.id);
  if (ok) {
    if (APP.status === 'closing') {
      await maintain();
    }
    await redisClient.delAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
  }
  setTimeout(sweep, SWEEP_INTERVAL);
};
