const moment = require('moment');
const buildList = require('../../model/build_req_list');
const executeBuild = require('./executor');
const utils = require('../../utils');

function run() {
  executeBuild();
  const { nextTime, prevTime, now } = utils.getTodayRange();
  const todayListKey = utils.getTodayListKey();

  async function execute() {
    console.log('is executing schedule, now: ', new Date());
    try {
      const reqs = await buildList.all(todayListKey);
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
        const { repo } = repoObj;
        const { created_at: updatedAt } = repo;
        if (updatedAt < prevTime) {
          continue;
        }

        try {
          const didPick = await buildList.redisClient.lremAsync(
            todayListKey,
            1,
            repoStr,
          );
          if (!didPick) {
            // 其他服务器消费了这个item
            continue;
          }
          await buildList.push(repoStr, buildList.BUILD_EXEC_LIST_KEY);
        } catch (error) {
          console.error(error);
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
