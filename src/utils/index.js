const {
  FIRE_HOUR,
  FIRE_MINUTE,
  FIRE_MILLISECOND,
  FIRE_SECOND,
} = config;


module.exports = {
  getTodayRange() {
    return (() => {
      const now = new Date();
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

      return { nextTime, prevTime, now };
    })();
  },

  getTodayListKey() {
    const { nextTime } = this.getTodayRange();
    return `${appInfo.name}:build_list:${nextTime}`;
  },
};
