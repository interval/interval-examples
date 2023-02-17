import path from 'path';
import 'dotenv/config';
import { Interval } from '@interval/sdk';

const interval = new Interval({
  apiKey: process.env.INTERVAL_KEY,
  routesDirectory: path.resolve(__dirname, 'routes'),
});

interval.listen();
