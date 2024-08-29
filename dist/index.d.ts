export * from './utils.js';
export * from './trace.js';
export * from './instrument.js';
export * from './vercel.js';
export * as iudexConsole from './instrumentations/console-instrumentation.js';
export * as iudexCloudflare from './cloudflare-worker.js';
/**
 * Adds attribute to current span
 */
export declare function trackAttribute(key: string, value: any): void;
/**
 * Adds attribute to all logs and spans
 */
export declare function trackGlobalAttribute(key: string, value: any): void;
