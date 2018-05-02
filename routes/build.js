const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');

const { DATA_VOLUME, REDIS_HOST } = config;

const router = express.Router();

(() => {
  var redis = require("redis"),
  client = redis.createClient({
    host: REDIS_HOST,
  });

  // if you'd like to select database 3, instead of 0 (default), call
  // client.select(3, function() { /* ... */ });

  client.on("error", function (err) {
    console.log("Error " + err);
  });

  client.set("string key", "string val", redis.print);
  client.hset("hash key", "hashtest 1", "some value", redis.print);
  client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
  client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
      console.log("    " + i + ": " + reply);
    });
    client.quit();
  });
})();

async function handleTask(req, res, next) {
  const { query, body: { repository: { git_http_url } } } = req;
  const { actions, access_token, account } = query;
  if (!access_token || !account) {
    res.end('need auth');
    return;
  }

  const repoName = git_http_url.split('/').pop();
  const withAuth = git_http_url.replace(/^(\s*http[s]?:\/\/)/, `$1${account}:${access_token}@`);

  const shellProgram = `
    cd "${DATA_VOLUME}"
    if [ ! -d '${repoName}' ] ; then
      git clone "${withAuth}" "${repoName}"
      echo git clone "${withAuth}" "${repoName}"
    fi
    cd "${repoName}"
    ${actions}
  `;

  const shellProgramName = `${repoName}.sh`;
  fs.writeFile(shellProgramName, shellProgram, (err) => {
    const proc = spawn('bash', ["-x", shellProgramName]);
  	proc.stdout.on('data', (data) => {
  		console.log('stdout: ', (data || '').toString());
  	});
    res.end(err ? err.message : 'ok');
  });
}

router.post('/', wrapAsync(handleTask));

module.exports = router;
