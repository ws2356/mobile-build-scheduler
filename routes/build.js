const express = require('express');
const { spawn } = require('child_process');

const { DATA_VOLUME } = config;

const router = express.Router();

async function handleTask(req, res, next) {
  const { query, body: { repository: { git_http_url } } } = req;
  const { actions, access_token, account } = query;
  if (!access_token || !account) {
    res.end('need auth');
    return;
  }

  const repoName = git_http_url.split('/').pop();
  const withAuth = git_http_url.replace(/^(\s*http[s]?:\/\/)/, `$1${account}:${access_token}`);

  const shellProgram = `
    cd "${DATA_VOLUME}"
    if [ ! -d '${repoName}' ] ; then
      git clone "${withAuth}" "${repoName}"
    fi
    cd "${repoName}"
    ${actions}
  `;

  spawn('eval', [shellProgram]);
  res.end('ok');
}

router.post('/', wrapAsync(handleTask));

module.exports = router;
