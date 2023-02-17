import { Page, Layout, io } from '@interval/sdk';
import { getRefunds } from '../../payments';

export default new Page({
  name: 'Refunds',
  handler: async () => {
    const refunds = await getRefunds();

    return new Layout({
      title: 'Refunds',
      description: 'View and create refunds for our customers.',
      menuItems: [
        {
          label: 'Create refund',
          route: 'refunds/refund_user',
        },
      ],
      children: [
        io.display.metadata('', {
          layout: 'card',
          data: [
            {
              label: 'Total refunds',
              value: refunds.length,
            },
          ],
        }),
        io.display.table('Refunds', {
          data: refunds,
        }),
      ],
    });
  },
});
