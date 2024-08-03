import { trace } from '@opentelemetry/api';
import _ from 'lodash';

export * from './utils.js';
export * from './trace.js';
export * from './instrument.js';
export * from './vercel.js';
export * as iudexConsole from './instrumentations/console-instrumentation.js';
export * as iudexCloudflare from './cloudflare-worker.js';

export function trackAttribute(key: string, value: any) {
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute(key, value);
}
