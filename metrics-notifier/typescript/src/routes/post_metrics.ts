import { Action, ctx } from '@interval/sdk';

async function activeUsers() {
  // replace with a call do your database/metrics store
  return 465;
}

export default new Action(async () => {
  const count = await activeUsers();
  ctx.log('Active user count:', count);
  await ctx.notify({
    message: `As of today, we have *${count}* monthly active users`,
    title: 'Latest active user count 📈',
    delivery: [
      {
        // ensure that you've added the Interval Slack app to this channel
        to: '#metrics',
        method: 'SLACK',
      },
    ],
  });
});
