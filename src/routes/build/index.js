const express = require('express');
const redisHash = require('../../model/redis_hash');
require('./schedule');

const router = express.Router();

async function handleTask(req, res) {
  const { query, body: repo } = req;
  const { object_kind: type, repository: { git_http_url: gitHttpUrl } } = repo;
  if (type !== 'push' && type !== 'tag_push') {
    res.status(400).end('webhook type not supported');
    return;
  }

  const { access_token: accessToken, account } = query;
  if (!accessToken || !account) {
    res.status(400).end('need auth');
    return;
  }

  try {
    repo.updated_at = Date.now();
    await redisHash.set(gitHttpUrl, { query, repo });
    res.end('request handled');
  } catch (e) {
    console.error('failed to update webhook request, error: ', repo, e);
    res.status(500).end(`failed to handle request: ${!e ? '' : (e.message || e.toString())}`);
  }
}

router.post('/', wrapAsync(handleTask));

module.exports = router;
