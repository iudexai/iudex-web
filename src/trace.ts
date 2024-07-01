import _ from 'lodash';
import {
  Span,
  SpanStatusCode,
  diag,
  trace,
} from '@opentelemetry/api';

import { config, emitOtelLog } from './utils.js';

export type TraceCtx<T extends (...args: any) => any = (...args: any) => any> = {
  name?: string;
  trackArgs?: boolean;
  attributes?: Record<string, any>;
  setSpan?: (span: Span, ret: ReturnType<T>) => void;
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
  ctx: TraceCtx<T> = {},
): T {
  if (ctx.beforeRun) {
    const beforeRun = ctx.beforeRun;
    return function (...args: Parameters<T>): ReturnType<T> {
      beforeRun(...args);
      return withTracing(fn, { ...ctx, beforeRun: undefined })(...args);
    } as T;
  }

  if (!config.isInstrumented) {
    return fn;
  }
  const { name, trackArgs = false, attributes, setSpan } = ctx;
  const tracer = trace.getTracer('default');
  return function (...args: Parameters<T>): ReturnType<T> {
    return tracer.startActiveSpan(name || fn.name || '<anonymous>', (span: Span) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }
        if (trackArgs) {
          if (args.length === 1) {
            span.setAttribute('arg', args[0]);
          } else if (args.length > 1) {
            span.setAttribute('args', args);
          }
        }
        const ret = fn(...args);


        // If its a promise, wait for it to resolve, follow async code path
        if (ret.then) {
          // If theres a setSpan handler, use that instead
          if (setSpan) {
            // Wait for ret to resolve, then call setSpan
            return ret.then((res: any) => {
              setSpan(span, ret);
              return res;
            });
          }

          return (ret as Promise<ReturnType<T>>)
            .then((res) => {
              span.setStatus({ code: SpanStatusCode.OK });
              return res;
            })
            .catch((err) => {
              span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
              span.recordException(err as Error);
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
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return ret;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.recordException(err as Error);
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
