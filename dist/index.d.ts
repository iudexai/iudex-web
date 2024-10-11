import { SpanStatusCode } from '@opentelemetry/api';
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
 * Adds attribute to current span
 */
export declare const setAttribute: typeof trackAttribute;
/**
 * Sets status of current span
 */
export declare function setStatus(code: SpanStatusCode): void;
/**
 * Sets error of the current span. Also sets status to error.
 */
export declare function setError(error: any): void;
/**
 * Sets status of current span
 */
export declare function setName(name: string): void;
/**
 * Adds attribute to all logs and spans
 */
export declare function trackGlobalAttribute(key: string, value: any): void;
