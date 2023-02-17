const path = require('path');
const { Interval } = require('@interval/sdk');
require('dotenv').config(); // loads environment variables from .env

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  routesDirectory: path.resolve(__dirname, 'routes'),
});

// Establishes a persistent connection between Interval and your app.
interval.listen();
