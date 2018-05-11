const moment = require('moment');
const redisHash = require('../../model/redis_hash');
const executeBuild = require('./executor');

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
      const allKeys = await redisHash.allKeys();
      for (const key of allKeys) {
        const repos = await redisHash.get(key);
        for (const repoStr of repos) {
          let repoObj = {};
          try {
            repoObj = JSON.parse(repoStr);
          } catch (e) {
            console.error('failed to json parse repoStr, error: ', e);
            continue;
          }
          const { query, repo } = repoObj;
          const { updated_at: updatedAt } = repo;
          if (updatedAt < prevTime) {
            continue;
          }
          await executeBuild({ query, repo });
        }
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
