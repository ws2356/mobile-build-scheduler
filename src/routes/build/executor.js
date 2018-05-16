const fs = require('fs');
const { spawn } = require('child_process');

const {
  HOST_IP,
  HOST_SSH_PORT,
  ID_RSA,
  ID_RSA_PUB,
  HOST_WORKDIR,
  HOST_USER,
} = config;

const ID_RSA_DIR = '/.ssh';
const ID_RSA_FILE = `${ID_RSA_DIR}/id_rsa`;
const ID_RSA_PUB_FILE = `${ID_RSA_DIR}/id_rsa.pub`;
async function writeSSHKey() {
  const shell = `
  [ ! -d "${ID_RSA_DIR}" ] && mkdir "${ID_RSA_DIR}" ;
  echo "${ID_RSA}" > "${ID_RSA_FILE}" ;
  echo "${ID_RSA_PUB}" > "${ID_RSA_PUB_FILE}"
  `;
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('bash', ['-xc', shell]);
      proc.on('close', (code) => {
        if (!code) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  } catch (error) {
    console.error('failed to writeSSHKey, error: ', error);
    return error;
  }

  try {
    fs.chmodSync(ID_RSA_FILE, '400');
  } catch (error) {
    console.error('failed to chmodSync, error:', error)
    return error;
  }

  return Promise.resolve(0);
}

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

  try {
    await writeSSHKey();
  } catch (error) {
    console.error('failed to writeSSHKey, error: ', error);
    return Promise.reject(error);
  }

  const shellProgram = `
    set -e
    [ -d "${HOST_WORKDIR}" ] || mkdir "${HOST_WORKDIR}"
    cd "${HOST_WORKDIR}"
    if [ ! -d '${repoName}' ] ; then
      git clone "${withAuth}" "${repoName}"
    fi
    cd "${repoName}"
    git reset --hard
    ${actions}
  `;

  return new Promise((resolve, reject) => {
    console.log('executing shellProgram: %s', shellProgram);
    const proc = spawn(
      'ssh',
      [
        '-o', 'StrictHostKeyChecking no',
        '-i', `${ID_RSA_FILE}`,
        '-p', `${HOST_SSH_PORT}`,
        `${HOST_USER}@${HOST_IP}`,
        `bash -xc "${shellProgram}"`,
      ],
    );
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
    process.on('SIGTERM', () => {
      proc.kill();
      resolve('SIGTERM');
    });
  });
};
