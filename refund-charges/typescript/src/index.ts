import path from 'path';
import { Interval } from '@interval/sdk';
import 'dotenv/config'; // loads environment variables from .env

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  routesDirectory: path.resolve(__dirname, 'routes'),
});

// Establishes a persistent connection between Interval and your app.
interval.listen();
