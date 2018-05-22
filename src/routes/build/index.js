const express = require('express');
const executeBuild = require('./executor');
const buildList = require('../../model/build_req_list');
require('./schedule');

const {
  BUILD_REQ_LIST_KEY,
  BUILD_EXEC_LIST_KEY,
  redisClient,
  all,
} = buildList;

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
    res.end('request handled');
    try {
      await buildList.push({ query, repo }, BUILD_EXEC_LIST_KEY);
      executeBuild();
    } catch (error) {
      console.error('failed to executeBuild, error: ', error);
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
  try {
    const allReqs = await all();
    for (const it of allReqs) {
      await redisClient.lremAsync(BUILD_REQ_LIST_KEY, 1, it);
    }
  } catch (error) {
    res.status(500).end('unkown error');
    return;
  }
  res.end('ok');
}));

router.get('/list', wrapAsync(async (req, res) => {
  try {
    const ret = { queued: [], executing: [] };
    const reqs = await buildList.all();
    const execs = await buildList.all(BUILD_EXEC_LIST_KEY);
    for (const [list, dest] of [[reqs, ret.queued], [execs, ret.executing]]) {
      for (const repoStr of list) {
        let repoObj = {};
        try {
          repoObj = JSON.parse(repoStr);
        } catch (e) {
          console.error('failed to json parse repoStr, error: ', e);
          continue;
        }
        dest.push(repoObj);
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(ret));
  } catch (e) {
    console.error(e);
    res.status(500).end(e);
  }
}));

module.exports = router;
