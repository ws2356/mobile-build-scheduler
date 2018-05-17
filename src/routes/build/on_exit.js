const {
  redisClient,
} = require('../../model/build_req_list');
const { BUILD_REQ_LIST_MAINTAIN_KEY } = require('./lock_key');

async function gracefulShutdown() {
  APP.status = 'closing';
  try {
    console.log('closing: get maintainer');
    const maintainer = await redisClient.getAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
    if (maintainer === APP.id) {
      console.log('closing:  maintainer is us: %s', APP.id);
      await redisClient.delAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
    } else {
      console.log('closing:  maintainer is not us: %s', APP.id);
    }
    process.exit(0);
  } catch (error) {
    console.log('closing: failed with error: ', error && error.message);
    process.exit(-1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
