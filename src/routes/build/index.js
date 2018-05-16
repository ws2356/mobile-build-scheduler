const express = require('express');
const executeBuild = require('./executor');
const buildList = require('../../model/build_req_list');
require('./schedule');
const { BUILD_REQ_LIST_MAINTAIN_KEY } = require('./lock_key');

const {
  redisClient,
  shift,
} = require('../../model/build_req_list');

const router = express.Router();

async function handleTask(req, res) {
  const { query, body: repo } = req;
  const { object_kind: type } = repo;
  if (type !== 'push' && type !== 'tag_push') {
    res.status(400).end('webhook type not supported');
    return;
  }

  const { access_token: accessToken, account, urgent } = query;
  if (!accessToken || !account) {
    res.status(400).end('need auth');
    return;
  }

  if (urgent) {
    try {
      executeBuild({ query, repo });
      res.end('request handled');
    } catch (error) {
      res.status(500).end(`request failed: ${error}`);
    }
    return;
  }

  try {
    repo.created_at = Date.now();
    await buildList.push({ query, repo });
    res.end('request handled');
  } catch (e) {
    console.error('failed to update webhook request, error: ', repo, e);
    res.status(500).end(`failed to handle request: ${!e ? '' : (e.message || e.toString())}`);
  }
}

router.post('/', wrapAsync(handleTask));
router.put('/clear', wrapAsync(async (req, res) => {
  const MAX_RETRY_TIME = 600000;
  const RETRY_WAIT_INTERVAL = 5000;
  let retryTime = 0;
  let done = false;
  try {
    do {
      const ok = await redisClient.setnxAsync(BUILD_REQ_LIST_MAINTAIN_KEY, 'is maintaining');
      if (ok) {
        while (true) {
          try {
            const one = await shift();
            if (!one) {
              done = true;
              break;
            }
          } catch (error) {
            done = true;
            res.status(500).end(error ? error.toString() : 'failed to shift');
            break;
          }
        }
        await redisClient.delAsync(BUILD_REQ_LIST_MAINTAIN_KEY);
      } else {
        await new Promise((resolve) => {
          setTimeout(resolve, RETRY_WAIT_INTERVAL);
        });
        retryTime += RETRY_WAIT_INTERVAL;
      }
    } while (retryTime < MAX_RETRY_TIME && !done);
  } catch (error) {
    res.status(500).end('unkown error');
    return;
  }

  if (done) {
    res.end('ok');
  } else {
    res.status(500).end('get lock timeout');
  }
}));

module.exports = router;
