import type { ExportedHandler, ExportedHandlerFetchHandler, ExportedHandlerTailHandler, ExportedHandlerTraceHandler, ExportedHandlerScheduledHandler, ExportedHandlerTestHandler, EmailExportedHandler, ExportedHandlerQueueHandler } from '@cloudflare/workers-types/index.ts';
import { TraceCtx } from './trace.js';
import { InstrumentConfig } from './instrument.js';
type Handler<Env, QueueHandlerMessage, CfHostMetadata> = NonNullable<ExportedHandlerFetchHandler<Env, CfHostMetadata> | ExportedHandlerTailHandler<Env> | ExportedHandlerTraceHandler<Env> | ExportedHandlerScheduledHandler<Env> | ExportedHandlerTestHandler<Env> | EmailExportedHandler<Env> | ExportedHandlerQueueHandler<Env, QueueHandlerMessage>>;
export declare const workersConfigSettings: {
    instrumentWindow: boolean;
    instrumentXhr: boolean;
};
export declare function withTracing<Env extends {
    IUDEX_API_KEY?: string;
} = {
    IUDEX_API_KEY?: string;
}, QueueHandlerMessage = unknown, CfHostMetadata = unknown, T extends Handler<Env, QueueHandlerMessage, CfHostMetadata> = Handler<Env, QueueHandlerMessage, CfHostMetadata>>(fn: T, ctx?: TraceCtx<T>, config?: InstrumentConfig): T;
export declare function trace<Env extends {
    IUDEX_API_KEY: string;
} = {
    IUDEX_API_KEY: string;
}, QueueHandlerMessage = unknown, CfHostMetadata = unknown, EH extends ExportedHandler<Env, QueueHandlerMessage, CfHostMetadata> = ExportedHandler<Env, QueueHandlerMessage, CfHostMetadata>>(exportedHandler: EH, ctx: TraceCtx & {
    name: string;
}, config?: InstrumentConfig): EH;
export {};
