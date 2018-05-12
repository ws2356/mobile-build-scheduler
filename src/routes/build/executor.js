const { spawn } = require('child_process');

const { DATA_VOLUME } = config;

module.exports = async function executeBuild({ query, repo }) {
  const { ref, repository: { git_http_url: gitHttpUrl } } = repo;
  const { actions, access_token: accessToken, account } = query;

  const repoName = gitHttpUrl.split('/').pop();
  const withAuth = gitHttpUrl.replace(/^(\s*http[s]?:\/\/)/, `$1${account}:${accessToken}@`);

  const match = ref.match(/refs\/(heads|tags)\/(.+)/);
  const branchOrTag = match && match[2];
  if (!branchOrTag) {
    console.error('invalid branch or tag extracted from ref: %s', ref);
    console.error('repo is: %s', JSON.stringify(repo, null, 4));
    return Promise.resolve();
  }

  const shellProgram = `
    cd "${DATA_VOLUME}"
    if [ ! -d '${repoName}' ] ; then
      git clone "${withAuth}" "${repoName}"
      echo git clone "${withAuth}" "${repoName}"
    fi
    cd "${repoName}"
    pwd
    git reset --hard
    git checkout "${branchOrTag}"
    git branch
    echo "executing shell: ${actions}"
    export REF="${branchOrTag}"
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
