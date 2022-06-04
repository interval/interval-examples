const { Interval } = require('@interval/sdk');
require('dotenv').config(); // loads environment variables from .env

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  actions: {
    enter_one_number: async io => {
      const num = await io.input.number('Enter a number');
      return {
        num,
      };
    },
    enter_two_numbers: async io => {
      const first = await io.input.number('Enter a number');
      const second = await io.input.number(
        `Enter a number greater than ${first}`,
        {
          min: first + 1,
        }
      );
      return {
        first,
        second,
      };
    },
  },
});

interval.listen();
