const {
  redisClient,
} = require('../../model/build_req_list');
const { BUILD_REQ_LIST_MAINTAIN_KEY } = require('./lock_key');

process.on('SIGTERM', async () => {
  APP.status = 'closing';
  try {
    const maintainer = await redisClient.getAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
    if (maintainer === APP.id) {
      await redisClient.delAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
    }
    process.exit(0);
  } catch (error) {
    process.exit(-1);
  }
});
