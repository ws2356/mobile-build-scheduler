const moment = require('moment');
const buildList = require('../../model/build_req_list');
const executeBuild = require('./executor');
require('./sweep')();

const {
  FIRE_HOUR,
  FIRE_MINUTE,
  FIRE_MILLISECOND,
  FIRE_SECOND,
} = config;

function run() {
  const now = new Date();
  const { nextTime, prevTime } = (() => {
    const nextTime = new Date(now.getTime());
    nextTime.setUTCHours(FIRE_HOUR);
    nextTime.setUTCMinutes(FIRE_MINUTE);
    nextTime.setUTCSeconds(FIRE_SECOND);
    nextTime.setUTCMilliseconds(FIRE_MILLISECOND);

    const prevTime = new Date(nextTime.getTime());
    prevTime.setUTCDate(prevTime.getUTCDate() - 1);

    const isPassed = nextTime <= now;
    if (isPassed) {
      nextTime.setUTCDate(nextTime.getUTCDate() + 1);
      prevTime.setUTCDate(prevTime.getUTCDate() + 1);
    }

    return { nextTime, prevTime };
  })();

  async function execute() {
    console.log('is executing schedule, now: ', new Date());
    try {
      const reqs = await buildList.all();
      for (const repoStr of reqs) {
        if (APP.status === 'closing') {
          break;
        }
        let repoObj = {};
        try {
          repoObj = JSON.parse(repoStr);
        } catch (e) {
          console.error('failed to json parse repoStr, error: ', e);
          continue;
        }
        const { query, repo } = repoObj;
        const { created_at: updatedAt } = repo;
        if (updatedAt < prevTime) {
          continue;
        }
        await executeBuild({ query, repo });
      }
    } catch (e) {
      console.error(e);
    }

    run();
  }

  const countdown = nextTime.getTime() - now.getTime();
  const remainTime = moment.duration(countdown);
  console.log(
    'countdown - %d hours %d minutes %d seconds: ',
    remainTime.hours(),
    remainTime.minutes(),
    remainTime.seconds(),
  );
  setTimeout(execute, Math.max(0, countdown));
}

run();
