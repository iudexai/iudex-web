import { trace } from '@opentelemetry/api';
import _ from 'lodash';

export * from './utils.js';
import { config } from './utils.js';
export * from './trace.js';
export * from './instrument.js';
export * from './vercel.js';
export * as iudexConsole from './instrumentations/console-instrumentation.js';
export * as iudexCloudflare from './cloudflare-worker.js';

/**
 * Adds attribute to current span
 */
export function trackAttribute(key: string, value: any) {
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute(key, value);
}

/**
 * Adds attribute to all logs and spans
 */
export function trackGlobalAttribute(key: string, value: any) {
  const { loggerProvider, tracerProvider } = config;

  // Hacky, no way through otel to do this rn
  const loggerAttrs = (loggerProvider as any)?._sharedState.resource?._attributes;
  if (loggerAttrs) {
    loggerAttrs[key] = value;
  }

  const tracerAttrs = (tracerProvider as any)?.resource?._attributes;
  if (tracerAttrs) {
    tracerAttrs[key] = value;
  }
}
