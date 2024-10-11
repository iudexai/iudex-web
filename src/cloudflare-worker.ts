
import type {
  ExportedHandler,
  ExportedHandlerFetchHandler,
  ExportedHandlerTailHandler,
  ExportedHandlerTraceHandler,
  ExportedHandlerScheduledHandler,
  ExportedHandlerTestHandler,
  EmailExportedHandler,
  ExportedHandlerQueueHandler,
  ExecutionContext,
} from '@cloudflare/workers-types/index.ts';
import _ from 'lodash';
import { XMLHttpRequest, config as utilConfig } from './utils.js';
import { TraceCtx, withTracing as baseWithTracing } from './trace.js';
import { InstrumentConfig, instrument } from './instrument.js';

type Handler<Env, QueueHandlerMessage, CfHostMetadata> = NonNullable<
  | ExportedHandlerFetchHandler<Env, CfHostMetadata>
  | ExportedHandlerTailHandler<Env>
  | ExportedHandlerTraceHandler<Env>
  | ExportedHandlerScheduledHandler<Env>
  | ExportedHandlerTestHandler<Env>
  | EmailExportedHandler<Env>
  | ExportedHandlerQueueHandler<Env, QueueHandlerMessage>
>;

export const workersConfigSettings = {
  instrumentUserInteraction: false,
  instrumentDocumentLoad: false,
  instrumentXhr: false,
};

export function withTracing<
  Env = any,
  QueueHandlerMessage = any,
  CfHostMetadata = any,
  T extends Handler<Env, QueueHandlerMessage, CfHostMetadata>
  = Handler<Env, QueueHandlerMessage, CfHostMetadata>,
>(
  fn: T,
  ctx: TraceCtx<T> = {},
  config: InstrumentConfig = {},
): T {
  // Polyfill XMLHttpRequest for workers
  if (!globalThis.XMLHttpRequest) (globalThis as any).XMLHttpRequest = XMLHttpRequest;

  if (!ctx.beforeRun) ctx.beforeRun = (arg1: any, env: any, ctx: any) => {
    /*
      Otel uses XMLHttpRequest which doesnt exist in workers.
      Its polyfilled with fetch. But since fetch uses promises
      we manually add the fetch promise to the service worker settle queue.
    */
    utilConfig.workerEvent = ctx;

    // Set window and XHR instrumentations to false for workers
    if (config.settings == null)
      config.settings = workersConfigSettings;
    if (config.settings.instrumentUserInteraction == null)
      config.settings.instrumentUserInteraction = false;
    if (config.settings.instrumentDocumentLoad == null)
      config.settings.instrumentDocumentLoad = false;
    if (config.settings.instrumentXhr == null)
      config.settings.instrumentXhr = false;
    if (config.iudexApiKey == null)
      config.iudexApiKey = env['IUDEX_API_KEY'] || env['PUBLIC_WRITE_ONLY_IUDEX_API_KEY'];

    instrument(config);
  };

  return baseWithTracing(fn, ctx) as T;
}

export function trace<
  Env = any,
  QueueHandlerMessage = any,
  CfHostMetadata = any,
  EH extends ExportedHandler<Env, QueueHandlerMessage, CfHostMetadata>
  = ExportedHandler<Env, QueueHandlerMessage, CfHostMetadata>,
>(exportedHandler: EH, ctx: TraceCtx & { name: string }, config: InstrumentConfig = {}): EH {
  return _.mapValues(exportedHandler, (handler, key) => {
    if (!handler) return;
    return withTracing<
      Env,
      QueueHandlerMessage,
      CfHostMetadata
    >(
      handler as Handler<Env, QueueHandlerMessage, CfHostMetadata>,
      { ...ctx, name: `${ctx.name}.${key}` },
      config,
    );
  }) as EH;
}
