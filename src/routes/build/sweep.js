const {
  redisClient,
  BUILD_REQ_LIST_KEY,
  shift,
  at,
} = require('../../model/build_req_list');

const {
  SWEEP_INTERVAL = 60000,
  STALE_DURATION = 86400000,
} = config;

const BUILD_REQ_LIST_MAINTAIN_KEY = `${BUILD_REQ_LIST_KEY}:maintaining`;

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
  const ok = await redisClient.setnxAsync(BUILD_REQ_LIST_MAINTAIN_KEY, 'is maintaining');
  if (ok) {
    await maintain();
    await redisClient.delAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
  }
  setTimeout(sweep, SWEEP_INTERVAL);
};
