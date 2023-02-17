import { Action, io } from '@interval/sdk';
import QRCode from 'qrcode';

export default new Action(async () => {
  const url = await io.input.url('URL for the QR code to link to', {
    placeholder: 'https://example.com',
  });

  const buffer = await QRCode.toBuffer(url.toString());

  await io.display.image('Generated QR code', { buffer });

  return 'All done!';
});
