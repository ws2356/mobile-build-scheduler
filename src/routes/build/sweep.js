const {
  BUILD_REQ_LIST_KEY,
  BUILD_EXEC_LIST_KEY,
  redisClient,
  all,
} = require('../../model/build_req_list');

const {
  SWEEP_INTERVAL = 3600000,
} = config;

module.exports = async function sweep() {
  if (APP.status === 'closing') {
    return;
  }

  try {
    const allReqs = await all();
    const allExecuted = await all(BUILD_EXEC_LIST_KEY);
    for (const [list, key] of [[allReqs, BUILD_REQ_LIST_KEY], [allExecuted, BUILD_EXEC_LIST_KEY]]) {
      for (const it of list) {
        if (APP.status === 'closing') {
          return;
        }
        let repoObj = {};
        try {
          repoObj = JSON.parse(it);
        } catch (e) {
          console.error('failed to json parse repoStr, error: ', e);
          continue;
        }
        const { repo } = repoObj;
        const { created_at: updatedAt } = repo;
        if (Date.now() - updatedAt <= 48 * 3600 * 1000) {
          continue;
        }
        await redisClient.lremAsync(key, 1, it);
      }
    }
  } catch (error) {
    console.error(error);
  }
  setTimeout(sweep, SWEEP_INTERVAL);
};
