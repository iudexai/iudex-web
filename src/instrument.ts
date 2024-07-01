
import {
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  InstrumentationConfigMap,
  getWebAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-web';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import {
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions';
import _ from 'lodash';

import { config } from './utils.js';
import { instrumentConsole } from './console.js';

export type InstrumentConfig = {
  baseUrl?: string;
  iudexApiKey?: string;
  serviceName?: string;
  instanceId?: string;
  gitCommit?: string;
  githubUrl?: string;
  env?: string;
  headers?: Record<string, string>;
  settings?: Partial<{
    instrumentConsole: boolean,
    instrumentWindow: boolean,
    instrumentXhr: boolean,
  }>;
};

export function instrument({
  baseUrl = process.env.IUDEX_EXPORTER_OTLP_ENDPOINT
    || process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    || 'https://api.iudex.ai',
  iudexApiKey = process.env.IUDEX_API_KEY,
  serviceName = process.env.OTEL_SERVICE_NAME || 'unknown-service',
  instanceId,
  gitCommit = process.env.GIT_COMMIT,
  githubUrl = process.env.GITHUB_URL,
  env = process.env.NODE_ENV,
  headers: configHeaders = {},
  settings = {},
}: InstrumentConfig = {}) {
  if (config.isInstrumented) return;

  if (!iudexApiKey) {
    console.warn(
      `The IUDEX_API_KEY environment variable is missing or empty.` +
      ` Provide IUDEX_API_KEY to the environment on load` +
      ` OR instrument with the iudexApiKey option.` +
      ` Example: \`instrument{ iudexApiKey: 'My_API_Key' })\``,
    );
    return;
  }

  const headers: Record<string, string> = {
    'x-api-key': iudexApiKey,
    ...configHeaders,
  };

  if (!gitCommit) {
    try {
      const { execSync } = require('child_process');
      gitCommit = execSync('git rev-parse HEAD').toString().trim();
    } catch (e) {
      // Swallow the error
    }
  }

  const resource = new Resource(_.omitBy({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: instanceId,
    'git.commit': gitCommit,
    'github.url': githubUrl,
    'env': env,
  }, _.isNil));

  // Configure logger
  const logExporter = new OTLPLogExporter({ url: baseUrl + '/v1/logs', headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);
  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  logs.setGlobalLoggerProvider(loggerProvider);

  // Configure tracer
  const traceExporter = new OTLPTraceExporter({ url: baseUrl + '/v1/traces', headers });
  const spanProcessors = [new SimpleSpanProcessor(traceExporter)];


  // INSTRUMENT
  const provider = new WebTracerProvider();
  provider.addSpanProcessor(spanProcessors[0]);
  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new B3Propagator(),
  });

  const instrumentationConfigMap: InstrumentationConfigMap = {};

  if (!settings.instrumentWindow || settings.instrumentConsole != undefined) {
    instrumentationConfigMap['@opentelemetry/instrumentation-user-interaction']
      = { enabled: false };
    instrumentationConfigMap['@opentelemetry/instrumentation-document-load']
    = { enabled: false };
  }

  if (!settings.instrumentXhr || settings.instrumentXhr != undefined) {
    instrumentationConfigMap['@opentelemetry/instrumentation-xml-http-request']
      = { enabled: false };
  }

  // Registering instrumentations
  registerInstrumentations({
    instrumentations: [getWebAutoInstrumentations(instrumentationConfigMap)],
  });


  // Instrument console
  if (settings.instrumentConsole || settings.instrumentConsole == undefined) {
    instrumentConsole();
  }

  // Set global flag
  config.isInstrumented = true;

  return;
}
