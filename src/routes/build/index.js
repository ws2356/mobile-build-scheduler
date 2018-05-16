const express = require('express');
const executeBuild = require('./executor');
const buildList = require('../../model/build_req_list');
require('./schedule');

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
    executeBuild({ query, repo });
    res.end('request handled');
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

module.exports = router;
