import { Action, io } from '@interval/sdk';

export default new Action(async () => {
  const name = await io.input.text('Enter your name');
  return `Hello, ${name}!`;
});
