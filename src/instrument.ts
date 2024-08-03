
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Instrumentation, registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  InstrumentationConfigMap,
  getWebAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-web';
import {
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions';
import _ from 'lodash';

import { config } from './utils.js';
import { instrumentConsole } from './instrumentations/console-instrumentation.js';
import { LoggerProvider } from './opentelemetry/logger-provider.js';
import {
  UserInteractionInstrumentation,
} from './instrumentations/user-interaction-instrumentation.js';


export type InstrumentConfig = {
  baseUrl?: string;
  iudexApiKey?: string;
  publicWriteOnlyIudexApiKey?: string;
  serviceName?: string;
  instanceId?: string;
  gitCommit?: string;
  githubUrl?: string;
  env?: string;
  headers?: Record<string, string>;
  settings?: {
    instrumentConsole?: boolean,
    instrumentWindow?: boolean,
    instrumentXhr?: boolean,
    instrumentFetch?: boolean,
    emitToConsole?: boolean,
  };
  otelConfig?: InstrumentationConfigMap;
};


export function defaultInstrumentConfig() {
  if (typeof process === 'undefined') {
    (global as any).process = { env: {} };
  }

  if (typeof process.env === 'undefined') {
    (global as any).process.env = {};
  }

  return {
    baseUrl: process.env.IUDEX_EXPORTER_OTLP_ENDPOINT
    || process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    || 'https://api.iudex.ai',
    iudexApiKey: process.env.IUDEX_API_KEY,
    publicWriteOnlyIudexApiKey: process.env.PUBLIC_WRITE_ONLY_IUDEX_API_KEY
    || process.env.NEXT_PUBLIC_WRITE_ONLY_IUDEX_API_KEY,
    serviceName: process.env.OTEL_SERVICE_NAME || 'unknown-service',
    gitCommit: process.env.GIT_COMMIT,
    githubUrl: process.env.GITHUB_URL,
    env: process.env.NODE_ENV,
    headers: {},
    settings: {},
    otelConfig: {},
  } satisfies InstrumentConfig;
}

export function instrument(instrumentConfig: InstrumentConfig = {}) {
  if (config.isInstrumented) return;

  const {
    baseUrl,
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    serviceName,
    instanceId,
    gitCommit,
    githubUrl,
    env,
    headers: configHeaders,
    settings,
    otelConfig,
  }: InstrumentConfig = { ...defaultInstrumentConfig(), ...instrumentConfig };
  if (!publicWriteOnlyIudexApiKey && !iudexApiKey) {
    console.warn(
      `The PUBLIC_WRITE_ONLY_IUDEX_API_KEY environment variable is missing or empty.` +
      ` Provide PUBLIC_WRITE_ONLY_IUDEX_API_KEY to the environment on load` +
      ` OR instrument with the publicWriteOnlyIudexApiKey option.` +
      ` Example: \`instrument{ publicWriteOnlyIudexApiKey: 'My_API_Key' })\``,
    );
    return;
  }

  let url: any = baseUrl;
  if (url == null || url === 'undefined' || url === 'null') {
    url = 'https://api.iudex.ai';
  }

  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });
  const resource = buildResource({ serviceName, instanceId, gitCommit, githubUrl, env });

  // Configure logger
  const logExporter = new OTLPLogExporter({ url: url + '/v1/logs', headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);
  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  logs.setGlobalLoggerProvider(loggerProvider);

  // Configure tracer
  const traceExporter = new OTLPTraceExporter({ url: url + '/v1/traces', headers });
  const spanProcessor = settings.emitToConsole
    ? new SimpleSpanProcessor(new ConsoleSpanExporter())
    : new BatchSpanProcessor(traceExporter);

  // INSTRUMENT
  const provider = new WebTracerProvider({ resource });
  provider.addSpanProcessor(spanProcessor);
  provider.register({
    contextManager: new ZoneContextManager(),
  });

  const instrumentationConfigMap: InstrumentationConfigMap = {};

  if (!settings.instrumentWindow || settings.instrumentWindow != undefined) {
    instrumentationConfigMap['@opentelemetry/instrumentation-user-interaction']
      = { enabled: false };
    instrumentationConfigMap['@opentelemetry/instrumentation-document-load']
      = { enabled: false };
  }

  // Default off
  if (!settings.instrumentFetch || settings.instrumentFetch == undefined) {
    instrumentationConfigMap['@opentelemetry/instrumentation-fetch']
      = { enabled: false };
  }


  if (!settings.instrumentXhr || settings.instrumentXhr != undefined) {
    instrumentationConfigMap['@opentelemetry/instrumentation-xml-http-request']
      = { enabled: false };
  }

  const instrumentations: Instrumentation[] = [
    // Not really using any instrumentation in here right now
    // getWebAutoInstrumentations(otelConfig || instrumentationConfigMap),
  ];

  // User interaction instrumentation depends on window
  if (typeof window !== 'undefined') {
    instrumentations.push(new UserInteractionInstrumentation(
      otelConfig['@opentelemetry/instrumentation-user-interaction'],
    ));
  }

  // Registering instrumentations
  registerInstrumentations({ instrumentations });

  // Instrument console
  if (settings.instrumentConsole || settings.instrumentConsole == undefined) {
    instrumentConsole();
  }

  // Set global flag
  config.isInstrumented = true;
}


export function buildHeaders(
  instrumentConfig: Pick<
    InstrumentConfig,
    'iudexApiKey' | 'publicWriteOnlyIudexApiKey' | 'headers'
  >,
): Record<string, string> {
  const {
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders,
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };

  const headers: Record<string, string> = { ...configHeaders };
  if (publicWriteOnlyIudexApiKey) {
    headers['x-write-only-api-key'] = publicWriteOnlyIudexApiKey;
  }
  if (iudexApiKey) {
    headers['x-api-key'] = iudexApiKey;
  }
  return headers;
}

export function buildResource(
  instrumentConfig: Pick<
    InstrumentConfig,
    'serviceName' | 'instanceId' | 'gitCommit' | 'githubUrl' | 'env'
  >,
): Resource {
  const {
    serviceName,
    instanceId,
    gitCommit,
    githubUrl,
    env,
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };

  return new Resource(_.omitBy({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: instanceId,
    'git.commit': gitCommit,
    'github.url': githubUrl,
    'env': env,
  }, _.isNil));
}
