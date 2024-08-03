export * from './utils.js';
export * from './trace.js';
export * from './instrument.js';
export * from './vercel.js';
export * as iudexConsole from './instrumentations/console-instrumentation.js';
export * as iudexCloudflare from './cloudflare-worker.js';
export declare function trackAttribute(key: string, value: any): void;
