import type { registerOTel as vercelRegisterOtel } from '@vercel/otel';
import { detectResourcesSync, envDetectorSync, Resource } from '@opentelemetry/resources';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { LogRecordLimits, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { logs } from '@opentelemetry/api-logs';

import {
  buildHeaders,
  buildResource,
  defaultInstrumentConfig,
  InstrumentConfig,
} from './instrument.js';
import { instrumentConsole } from './instrumentations/console-instrumentation.js';
import { config } from './utils.js';
import { XMLHttpRequest } from './utils.js';
import { LoggerProvider } from './opentelemetry/logger-provider.js';
import _ from 'lodash';

type Configuration = Exclude<Parameters<typeof vercelRegisterOtel>[0], string | undefined>


export function registerOTelOptions(
  optionsOrServiceName?: (Configuration & InstrumentConfig) | string,
) {
  // OTEL hack
  if (!globalThis.XMLHttpRequest) (globalThis as any).XMLHttpRequest = XMLHttpRequest;

  const options: (Configuration & InstrumentConfig) = typeof optionsOrServiceName === 'string'
    ? { serviceName: optionsOrServiceName }
    : optionsOrServiceName || {};

  const {
    baseUrl,
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders,
  } = { ...defaultInstrumentConfig(), ...options };


  let url: any = baseUrl;
  if (url == null || url === 'undefined' || url === 'null' || url === '') {
    url = 'https://api.iudex.ai';
  }

  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });

  const logExporter = new OTLPLogExporter({ url: url + '/v1/logs', headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);

  const traceExporter = new OTLPTraceExporter({ url: url + '/v1/traces', headers });

  let resource = buildResource(options);
  resource = buildVercelResource();
  const resourceDetectors = [envDetectorSync];
  const internalConfig = { detectors: resourceDetectors };
  resource = resource.merge(detectResourcesSync(internalConfig));

  // TODO add if exists, then merge somehow

  // Doesnt work well in nextjs edge
  // options.logRecordProcessor = logRecordProcessor;
  // Does what the nextjs one does but fixed edge (loggerprovider) problem
  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  logs.setGlobalLoggerProvider(loggerProvider);

  options.traceExporter = traceExporter;

  options.attributes = resource.attributes;

  const settings = options.settings || {};

  // Instrument console
  if (settings.instrumentConsole || settings.instrumentConsole == undefined) {
    // instrumentConsole();
  }

  config.isInstrumented = true;

  // return options as Configuration; // Should be this but wrong vercel export
  return options as any;
}


// OTEL PATCH

// function patchLoggerProviderConstructor() {
//   function patch(this: any, config: any) {
//     const mergedConfig = { ...loadDefaultConfig(), ...config };
//     const resource = Resource.default().merge(
//       mergedConfig.resource ?? Resource.empty(),
//     );
//     this._sharedState = new LoggerProviderSharedState(
//       resource,
//       mergedConfig.forceFlushTimeoutMillis,
//       reconfigureLimits(mergedConfig.logRecordLimits),
//     );
//     this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
//   }

//   patch.prototype = Object.create(sdkLogs.LoggerProvider.prototype);
//   patch.prototype.constructor = patch;

//   (sdkLogs as any).LoggerProvider = patch;
// }

function buildVercelResource() {
  const resource = new Resource(
    _.omitBy({
      // Node.
      'node.ci': process.env.CI ? true : undefined,
      'node.env': process.env.NODE_ENV,

      // Vercel.
      // https://vercel.com/docs/projects/environment-variables/system-environment-variables
      // Vercel Env set as top level attribute for simplicity.
      // One of 'production', 'preview' or 'development'.
      'env': process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV,
      'vercel.region': process.env.VERCEL_REGION,
      'vercel.runtime': process.env.NEXT_RUNTIME || 'nodejs',
      'vercel.sha':
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      'vercel.host':
        process.env.VERCEL_URL ||
        process.env.NEXT_PUBLIC_VERCEL_URL ||
        undefined,
      'vercel.branch_host':
        process.env.VERCEL_BRANCH_URL ||
        process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ||
        undefined,
    }, _.isNil),
  );
  return resource;
}