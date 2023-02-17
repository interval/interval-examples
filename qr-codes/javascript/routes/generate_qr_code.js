const { Action, io } = require('@interval/sdk');
const QRCode = require('qrcode');

module.exports = new Action(async () => {
  const url = await io.input.url('URL for the QR code to link to', {
    placeholder: 'https://example.com',
  });

  const buffer = await QRCode.toBuffer(url.toString());

  await io.display.image('Generated QR code', { buffer });

  return 'All done!';
});
