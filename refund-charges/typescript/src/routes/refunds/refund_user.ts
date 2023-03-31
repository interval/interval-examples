import { Action, io, ctx } from '@interval/sdk';
import { getCharges, refundCharge } from '../../payments';

export default new Action({
  unlisted: true,
  name: 'Create refund',
  handler: async () => {
    const customerEmail = await io.input.email(
      'Email of the customer to refund:'
    );

    console.log('Email:', customerEmail);

    const charges = await getCharges(customerEmail);

    const chargesToRefund = await io.select.table(
      'Select one or more charges to refund',
      {
        minSelections: 1,
        data: charges,
      }
    );

    await ctx.loading.start({
      label: 'Refunding charges',
      // Because we specified `itemsInQueue`, Interval will render a progress bar versus an indeterminate loading indicator.
      itemsInQueue: chargesToRefund.length,
    });

    for (const charge of chargesToRefund) {
      await refundCharge(charge.id);
      await ctx.loading.completeOne();
    }

    // Values returned from actions are automatically stored with Interval transaction logs
    return { chargesRefunded: chargesToRefund.length };
  },
});
