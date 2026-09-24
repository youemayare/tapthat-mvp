const fs = require('fs');
fs.appendFileSync('src/lib/ratelimit.ts', `
/** Waitlist Join */
export const waitlistJoinRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(10, '15 m'), 'tayz:waitlist_join')
  : failClosed;

/** Waitlist Survey Update */
export const waitlistSurveyRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(20, '15 m'), 'tayz:waitlist_survey')
  : failClosed;
`);
