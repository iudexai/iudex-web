import { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-web';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Instrumentation, registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from './instrumentations/fetch-instrumentation.js';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { Resource } from '@opentelemetry/resources';
import {
  LogRecord,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions';
import _ from 'lodash';

import { instrumentConsole } from './instrumentations/console-instrumentation.js';
import {
  UserInteractionInstrumentation,
} from './instrumentations/user-interaction-instrumentation.js';
import { LoggerProvider } from './opentelemetry/logger-provider.js';
import { RedactLogProcessor } from './opentelemetry/redact-log-processor.js';
import { patchXmlHttpRequestWithCredentials } from './patches/patch-xmlhttprequest.js';
import { config, XMLHttpRequest } from './utils.js';
import { BasicSessionProvider } from './sessions/provider.js';
import { SessionExporter } from './sessions/exporter.js';

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
  withCredentials?: boolean;
  settings?: {
    instrumentConsole?: boolean,
    instrumentXhr?: boolean,
    instrumentFetch?: boolean,
    instrumentUserInteraction?: boolean,
    instrumentDocumentLoad?: boolean,
    emitToConsole?: boolean,
    debugMode?: boolean,

    // Session Replay
    disableSessionReplay?: boolean,
    sessionReplaySampleRate?: number,
  };
  otelConfig?: InstrumentationConfigMap;
  redact?: RegExp | string | ((logRecord: LogRecord) => void);
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
    withCredentials: false,
    settings: {},
    otelConfig: {},
  } satisfies InstrumentConfig;
}

export function instrument(instrumentConfig: InstrumentConfig = {}) {
  if (config.isInstrumented) return;
  if (!globalThis.XMLHttpRequest) (globalThis as any).XMLHttpRequest = XMLHttpRequest;

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
    withCredentials,
    settings,
    otelConfig,
    redact,
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
  config.resource = resource;

  // Set up propagator
  const propagator = new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
    ],
  });

  // Configure logger
  const loggerProvider = new LoggerProvider({ resource });
  const logExporter = new OTLPLogExporter({ url: url + '/v1/logs', headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);
  if (redact) {
    const reactLogProcessor = new RedactLogProcessor(redact);
    loggerProvider.addLogRecordProcessor(reactLogProcessor);
  }
  if (typeof window !== 'undefined') {
    (window as any).loggerProvider = loggerProvider;
  }
  config.loggerProvider = loggerProvider;
  loggerProvider.addLogRecordProcessor(logRecordProcessor);

  // Configure tracer
  const traceExporter = new OTLPTraceExporter({ url: url + '/v1/traces', headers });
  const spanProcessor = settings.emitToConsole
    ? new SimpleSpanProcessor(new ConsoleSpanExporter())
    : new BatchSpanProcessor(traceExporter);

  // INSTRUMENT
  const tracerProvider = new WebTracerProvider({ resource });
  if (typeof window !== 'undefined') {
    (window as any).tracerProvider = tracerProvider;
  }
  config.tracerProvider = tracerProvider;
  tracerProvider.addSpanProcessor(spanProcessor);

  // if (typeof window !== 'undefined' && !settings.disableZone) {
  // Turn off because it causes so many problems and doesnt work on mobile
  // Even if the code never runs, it causes syntax errors on mobile
  // On web, it just causes issues with like, sentry
  // provider.register({ contextManager: new ZoneContextManager() });
  // }
  tracerProvider.register(
    {
      propagator,
    },
  );

  const instrumentations: Instrumentation[] = [];

  // Requires window to track user interaction
  if (typeof window !== 'undefined'
    && (settings.instrumentUserInteraction == null || settings.instrumentUserInteraction)
  ) {
    instrumentations.push(new UserInteractionInstrumentation({
      eventNames: [...EVENT_NAMES, ...EVENT_NAMES.map((name) => `react-${name}`)] as any,
      ...(otelConfig['@opentelemetry/instrumentation-user-interaction'] || {}),
    }));
  }

  // Requires window to track document load
  if (typeof window !== 'undefined'
    && (settings.instrumentDocumentLoad == null || settings.instrumentDocumentLoad)
  ) {
    instrumentations.push(new DocumentLoadInstrumentation(
      otelConfig['@opentelemetry/instrumentation-document-load'],
    ));
  }

  if (settings.instrumentFetch == null || settings.instrumentFetch) {
    instrumentations.push(new FetchInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      propagateTraceHeaderCorsUrls: /.*/,  // Propagate to all URL
      ...(otelConfig['@opentelemetry/instrumentation-fetch'] || {}),
    }));
  }

  if (settings.instrumentXhr == null || settings.instrumentXhr) {
    instrumentations.push(new XMLHttpRequestInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      ...(otelConfig['@opentelemetry/instrumentation-xml-http-request'] || {}),
    }));
  }

  if (settings.debugMode) {
    console.log('Loaded instrumentations: ', instrumentations);
  }

  // Registering instrumentations
  registerInstrumentations({ instrumentations });

  // Instrument console
  if (settings.instrumentConsole || settings.instrumentConsole == undefined) {
    instrumentConsole();
  }

  // re-patch on top of otel's patch
  patchXmlHttpRequestWithCredentials(url, withCredentials);

  if (typeof window !== 'undefined') {
    const sessionExporter = new SessionExporter({
      url: url + '/v1/sessions',
      headers,
      interval: 1000,
    });
    const sessionProvider = new BasicSessionProvider({
      exporter: sessionExporter,
    });
    (window as any).sessionProvider = sessionProvider;
    config.sessionProvider = sessionProvider;

    // Sample session recordings
    const sessionId = sessionProvider.getActiveSession().id;
    const random = Math.abs(
      Math.sin(sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)),
    );
    if (!settings.disableSessionReplay && random < (settings.sessionReplaySampleRate || 1)) {
      void sessionProvider.startRecording();
    }
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

export const FETCH_IGNORE_URLS = [
  /_next/,
  /\/static\//,
  /\/public\//,
  /logr-ingest.com/,
  /datadoghq.com/,
  /sentry.io/,
  /fullstory.com/,
  /posthog.com/,
  /segment.com/,
  /google-analytics.com/,
  /googletagmanager.com/,
  /hotjar.com/,
  /intercom.io/,
  /facebook.com/,
  /twitter.com/,
  /linkedin.com/,
  /cloudflare.com/,
  /cloudflare.net/,
  /cloudfront.net/,
  /akamaihd.net/,
  /fastly.net/,
  /gstatic.com/,
];

export const EVENT_NAMES = [
  'click',
  'mousedown',
  'mouseup',
  'keydown',
  'keyup',
  'touchstart',
  'touchend',
];
