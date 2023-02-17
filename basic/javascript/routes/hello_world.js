const { Action, io } = require('@interval/sdk');

module.exports = new Action(async () => {
  const name = await io.input.text('Enter your name');
  return `Hello, ${name}!`;
});
