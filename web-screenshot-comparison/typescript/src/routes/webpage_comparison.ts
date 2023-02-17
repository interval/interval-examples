import { Action, io, ctx } from '@interval/sdk';
import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export default new Action(async () => {
  const [_, baseUrl, compUrl] = await io.group([
    io.display.heading(
      'Select ground truth page and comparison page to compare screenshots'
    ),
    io.input.text('Ground truth URL'),
    io.input.text('Comparison URL'),
  ]);

  ctx.loading.start('Taking screenshots...');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(baseUrl);
  const baseScreenshot = await page.screenshot({
    encoding: 'binary',
    fullPage: true,
  });
  const baseBase64 = baseScreenshot.toString('base64');

  await page.goto(compUrl);
  const compScreenshot = await page.screenshot({
    encoding: 'binary',
    fullPage: true,
  });
  const compBase64 = compScreenshot.toString('base64');

  ctx.loading.update('Comparing screenshots...');

  const basePng = PNG.sync.read(baseScreenshot);
  const compPng = PNG.sync.read(compScreenshot);
  const diff = new PNG({ width: basePng.width, height: basePng.height });

  const diffPixels = pixelmatch(
    basePng.data,
    compPng.data,
    diff.data,
    basePng.width,
    basePng.height,
    { threshold: 0.1 }
  );

  const diffBase64 = PNG.sync.write(diff).toString('base64');

  if (diffPixels > 0) {
    await io.display.markdown(`
                              ## ⚠️ The pages are different

                              |      |      |      |
                                | ---- | ---- | ---- |
                                | ![Screenshot](data:image/png;base64,${baseBase64}) | ![Screenshot](data:image/png;base64,${diffBase64}) | ![Screenshot](data:image/png;base64,${compBase64}) |

                                `);
  } else {
    await io.display.markdown(`
                              ## ✅ These pages are the same

                              ![Screenshot](data:image/png;base64,${baseBase64})
                              `);
  }

  return 'Done!';
});
