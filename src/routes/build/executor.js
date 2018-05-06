const { spawn } = require('child_process');

const { DATA_VOLUME } = config;

module.exports = async function executeBuild({ query, repo }) {
  const { repository: { git_http_url: gitHttpUrl } } = repo;
  const { actions, access_token: accessToken, account } = query;

  const repoName = gitHttpUrl.split('/').pop();
  const withAuth = gitHttpUrl.replace(/^(\s*http[s]?:\/\/)/, `$1${account}:${accessToken}@`);

  const shellProgram = `
    cd "${DATA_VOLUME}"
    if [ ! -d '${repoName}' ] ; then
      git clone "${withAuth}" "${repoName}"
      echo git clone "${withAuth}" "${repoName}"
    fi
    cd "${repoName}"
    pwd
    echo "executing shell: ${actions}"
    ${actions}
  `;

  return new Promise((resolve, reject) => {
    console.log('executing shellProgram...');
    const proc = spawn('bash', ['-xc', shellProgram]);
    proc.stdout.on('data', (data) => {
      console.log('stdout: ', (data || '').toString());
    });
    proc.on('close', (code, signal) => {
      console.log('shellProgram did close, code, signal: ', code, signal);
      if (!code) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
};
