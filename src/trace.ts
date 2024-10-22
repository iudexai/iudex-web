import _ from 'lodash';
import {
  Span,
  SpanStatusCode,
  diag,
  trace,
} from '@opentelemetry/api';

import { config, emitOtelLog, flattenObject } from './utils.js';

export type TraceCtx<T extends (...args: any) => any = (...args: any) => any> = {
  name?: string;
  trackArgs?: boolean;
  maxArgKeys?: number
  maxArgDepth?: number
  attributes?: Record<string, any>;
  setSpan?: (span: Span, ret: ReturnType<T>) => void;
  setArgs?: (span: Span, args: any) => void;
  beforeRun?: (...args: Parameters<T>) => void;
};

/**
 * Trace decorator. Instruments a function to be traced.
 *
 * Example:
```
const fn = withTracing(async () => {
  console.log('hello');
});

await fn();
```
 *
 */
export function withTracing<T extends (...args: any) => any>(
  fn: T,
  ctx: TraceCtx = {},
): T {
  return function (...args: Parameters<T>): ReturnType<T> {
    const { name, trackArgs = true, maxArgKeys, maxArgDepth, attributes, setSpan, setArgs } = ctx;
    const tracer = trace.getTracer('default');

    if (!config.isInstrumented) {
      return fn(...args);
    }

    if (ctx.beforeRun) {
      ctx.beforeRun(...args);
    }

    return tracer.startActiveSpan(name || fn.name || '<anonymous>', (span: Span) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }
        if (trackArgs && !setArgs) {
          if (args.length === 1) {
            if (args[0] != null && typeof args[0] === 'object') {
              const flatObj = flattenObject(args[0], '', {}, new Set(), maxArgKeys, maxArgDepth);
              flatObj && Object.entries(flatObj).forEach(([key, value]) => {
                span.setAttribute(key, value);
              });
            } else if (args[0] == null) {
              span.setAttribute('args.0', `<${args[0]}>`);
            } else {
              span.setAttribute('args.0', args[0]);
            }
          } else if (args.length > 1) {
            const flatObjs = flattenObject(args, '', {}, new Set(), maxArgKeys, maxArgDepth);
            flatObjs && Object.entries(flatObjs).forEach(([key, value]) => {
              span.setAttribute(`args.${key}`, value);
            });
          }
        }
        if (setArgs) {
          setArgs(span, args);
        }
        // Run the function
        const ret = fn(...args);

        // If its a promise, wait for it to resolve, follow async code path
        if (ret.then) {
          // If theres a setSpan handler, use that instead
          if (setSpan) {
            // Wait for ret to resolve, then call setSpan
            setSpan(span, ret);
            return ret;
          }

          return (ret as Promise<ReturnType<T>>)
            .then((res) => {
              return res;
            })
            .catch((err) => {
              span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
              span.recordException(err as Error);
              span.setAttribute('exception.message', err.message);
              span.setAttribute('exception.stacktrace', err.stack);
              emitOtelLog({ level: 'ERROR', body: err });
              throw err;
            })
            .finally(() => {
              span.end();
            });
        }

        // If theres a setSpan handler, use that instead
        if (setSpan) {
          setSpan(span, ret);
          return ret;
        }

        // If not async, just return the result
        span.end();
        return ret;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
        span.recordException(err as Error);
        span.setAttribute('exception.message', (err as Error).message);
        (err as Error).stack
          && span.setAttribute('exception.stacktrace', (err as Error).stack || '');
        emitOtelLog({ level: 'ERROR', body: err });
        span.end();
        throw err;
      }
    });
  } as T;
}


/**
 * Starts a new trace from a function.
 */
export function useTracing<T extends (...args: any) => any>(
  fn: T,
  ctx: TraceCtx = {},
): ReturnType<T> {
  return withTracing(fn, ctx)();
}
