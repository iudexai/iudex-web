import { Span } from '@opentelemetry/api';
export type TraceCtx<T extends (...args: any) => any = (...args: any) => any> = {
    name?: string;
    trackArgs?: boolean;
    maxArgKeys?: number;
    maxArgDepth?: number;
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
export declare function withTracing<T extends (...args: any) => any>(fn: T, ctx?: TraceCtx): T;
/**
 * Starts a new trace from a function.
 */
export declare function useTracing<T extends (...args: any) => any>(fn: T, ctx?: TraceCtx): ReturnType<T>;
