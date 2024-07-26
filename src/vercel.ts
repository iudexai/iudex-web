import type { registerOTel as vercelRegisterOtel } from '@vercel/otel';
import {
  buildHeaders,
  buildResource,
  defaultInstrumentConfig,
  InstrumentConfig,
} from './instrument.js';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { instrumentConsole } from './console.js';
import { config } from './utils.js';

type Configuration = Exclude<Parameters<typeof vercelRegisterOtel>[0], string | undefined>

export function registerOTelOptions(
  optionsOrServiceName?: (Configuration & InstrumentConfig) | string,
) {
  const options: (Configuration & InstrumentConfig) = typeof optionsOrServiceName === 'string'
    ? { serviceName: optionsOrServiceName }
    : optionsOrServiceName || {};

  const {
    baseUrl,
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders,
  } = { ...defaultInstrumentConfig, ...options };

  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });

  const logExporter = new OTLPLogExporter({ url: baseUrl + '/v1/logs', headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);

  const traceExporter = new OTLPTraceExporter({ url: baseUrl + '/v1/traces', headers });
  const spanProcessor = new SimpleSpanProcessor(traceExporter);

  const resource = buildResource(options);
  options.attributes = resource.attributes;

  if (!options.logRecordProcessor) {
    options.logRecordProcessor = logRecordProcessor;
  }

  if (!options.spanProcessors) {
    options.spanProcessors = [spanProcessor];
  } else {
    options.spanProcessors.push(spanProcessor);
  }

  const settings = options.settings || {};

  // Instrument console
  if (settings.instrumentConsole || settings.instrumentConsole == undefined) {
    instrumentConsole();
  }

  config.isInstrumented = true;

  // return options as Configuration; // Should be this but wrong vercel export
  return options as any;
}
