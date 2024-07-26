"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Dispatch: () => Dispatch,
  XMLHttpRequest: () => XMLHttpRequest,
  buildHeaders: () => buildHeaders,
  buildResource: () => buildResource,
  config: () => config,
  convertSeverityTextToNumber: () => convertSeverityTextToNumber,
  convertSeverityValuesToLevel: () => convertSeverityValuesToLevel,
  defaultInstrumentConfig: () => defaultInstrumentConfig,
  emitOtelLog: () => emitOtelLog,
  flattenObject: () => flattenObject,
  getCallerInfo: () => getCallerInfo,
  instrument: () => instrument,
  iudexCloudflare: () => cloudflare_worker_exports,
  iudexConsole: () => console_exports,
  lazyObj: () => lazyObj,
  nativeConsole: () => nativeConsole,
  registerOTelOptions: () => registerOTelOptions,
  trackAttribute: () => trackAttribute,
  useTracing: () => useTracing,
  withTracing: () => withTracing
});
module.exports = __toCommonJS(src_exports);
var import_api2 = require("@opentelemetry/api");

// src/utils.ts
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var import_api_logs = require("@opentelemetry/api-logs");
var import_lodash = __toESM(require("lodash"));
var config = {
  isInstrumented: false,
  nativeConsole: { ...console },
  nativeFetch: fetch.bind(globalThis),
  workerEvent: void 0
};
var nativeConsole = config.nativeConsole;
function convertSeverityTextToNumber(severityText) {
  if (severityText == void 0) {
    return;
  }
  switch (severityText) {
    case "TRACE":
      return 1;
    case "DEBUG":
      return 5;
    case "INFO":
      return 9;
    case "WARN":
      return 13;
    case "ERROR":
      return 17;
    case "FATAL":
      return 21;
    default:
      return;
  }
}
__name(convertSeverityTextToNumber, "convertSeverityTextToNumber");
function convertSeverityValuesToLevel(severityNumber, severityText) {
  severityNumber ||= convertSeverityTextToNumber(severityText) || 0;
  if (severityNumber >= 1 && severityNumber <= 4) {
    return "TRACE";
  } else if (severityNumber >= 5 && severityNumber <= 8) {
    return "DEBUG";
  } else if (severityNumber >= 9 && severityNumber <= 12) {
    return "INFO";
  } else if (severityNumber >= 13 && severityNumber <= 16) {
    return "WARN";
  } else if (severityNumber >= 17 && severityNumber <= 20) {
    return "ERROR";
  } else if (severityNumber >= 21 && severityNumber <= 24) {
    return "FATAL";
  } else {
    return "INFO";
  }
}
__name(convertSeverityValuesToLevel, "convertSeverityValuesToLevel");
function getCallerInfo(frameDepth) {
  const stack = new Error().stack;
  if (!stack) return {};
  const stackLines = stack.split("\n");
  const callerStackLine = stackLines[frameDepth + 1];
  const callerAndPathRegex = /at (?<caller>.+?) \((?<filePath>[^:()]+(?::[^:()]+)*):(?<lineNum>\d+):\d+\)/;
  const capMatch = callerStackLine.match(callerAndPathRegex);
  if (capMatch) {
    const { filePath, lineNum, caller } = capMatch.groups;
    return { filePath, lineNum: Number(lineNum), caller };
  }
  const pathOnlyRegex = /at (?<filePath>[^:()]+(?::[^:()]+)*):(?<lineNum>\d+):\d+/;
  const poMatch = callerStackLine.match(pathOnlyRegex);
  if (poMatch) {
    const { filePath, lineNum } = poMatch.groups;
    return { filePath, lineNum: Number(lineNum) };
  }
  return {};
}
__name(getCallerInfo, "getCallerInfo");
function flattenObject(obj, parentKey = "", result = {}) {
  if (!obj) return;
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(obj[key])) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  });
  return result;
}
__name(flattenObject, "flattenObject");
function emitOtelLog({
  level,
  body,
  severityNumber,
  attributes,
  stackDepth
}) {
  if (!config.isInstrumented) return;
  const attrs = { ...attributes };
  if (stackDepth != null) {
    const { filePath, lineNum, caller } = getCallerInfo(stackDepth + 1);
    Object.assign(attrs, {
      [import_semantic_conventions.SEMATTRS_CODE_FILEPATH]: filePath,
      [import_semantic_conventions.SEMATTRS_CODE_LINENO]: lineNum,
      [import_semantic_conventions.SEMATTRS_CODE_FUNCTION]: caller
    });
  }
  const otelLogger = import_api_logs.logs.getLogger("default");
  otelLogger.emit({
    severityNumber: severityNumber || convertSeverityTextToNumber(level.toUpperCase()),
    severityText: level.toUpperCase(),
    body,
    attributes: import_lodash.default.omitBy(attrs, import_lodash.default.isNil)
  });
}
__name(emitOtelLog, "emitOtelLog");
var Dispatch = class extends EventTarget {
  static {
    __name(this, "Dispatch");
  }
  dispatch(eventName) {
    const ev = new Event(eventName);
    if ("on" + eventName in this) {
      this["on" + eventName](ev);
    }
    this.dispatchEvent(ev);
  }
};
var XMLHttpRequest = class extends Dispatch {
  static {
    __name(this, "XMLHttpRequest");
  }
  // readyState enumeration
  UNSENT = 0;
  OPENED = 1;
  HEADERS_RECEIVED = 2;
  LOADING = 3;
  DONE = 4;
  upload = new Dispatch();
  // Request
  url;
  method;
  headers;
  readyState;
  _controller;
  withCredentials = false;
  // Response
  errored = false;
  responseHeaders = void 0;
  responseURL;
  responseValue;
  responseType;
  status;
  statusText;
  constructor() {
    super();
  }
  open(method, url) {
    this.url = url;
    this.method = method;
    this.headers = new Headers();
    this.readyState = this.UNSENT;
    this.responseType = "";
    this._controller = new AbortController();
  }
  setRequestHeader(key, value) {
    this.headers?.set(key, value);
  }
  abort() {
    this.upload.dispatch("abort");
    this._controller?.abort();
  }
  send(payload) {
    this.readyState = this.OPENED;
    this.status = 0;
    this.dispatch("readystatechange");
    this.upload.dispatch("loadstart");
    if (!this.url) {
      throw new DOMException(
        `Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED`
      );
    }
    const fetchPromise = config.nativeFetch(this.url, {
      method: this.method,
      credentials: "credentials" in Request.prototype ? this.withCredentials ? "omit" : "include" : void 0,
      headers: this.headers,
      signal: this._controller?.signal,
      body: payload
    }).then((response) => {
      this.responseHeaders = response.headers;
      this.readyState = this.HEADERS_RECEIVED;
      this.responseURL = response.url;
      this.status = response.status;
      this.statusText = response.statusText;
      this.responseType = "text";
      const contentType = response.headers.get("content-type");
      if (!contentType) {
      } else if (contentType.includes("application/json")) {
        this.responseType = "json";
      } else if (contentType.includes("text/html")) {
        this.responseType = "document";
      } else if (contentType.includes("application/octet-stream")) {
        this.responseType = "blob";
      }
      switch (this.responseType) {
        case void 0:
          return response.text();
        case "blob":
          return response.blob();
        case "document":
          return response.text();
        case "json":
          return response.json();
      }
      return response.text();
    }).then((value) => {
      this.responseValue = value;
      this.readyState = this.DONE;
      this.dispatch("readystatechange");
      this.upload.dispatch("progress");
      this.dispatch("progress");
      this.upload.dispatch("load");
      this.dispatch("load");
    }).catch((err) => {
      this.errored = true;
      this.dispatch("error");
      this.upload.dispatch("error");
      this.readyState = this.DONE;
      this.dispatch("readystatechange");
    }).finally(() => {
      this.upload.dispatch("loadend");
      this.dispatch("loadend");
    });
    config.workerEvent?.waitUntil(fetchPromise);
  }
  get responseText() {
    if (this.responseValue) {
      if (this.responseType === "arraybuffer") {
        return new TextDecoder().decode(this.responseValue);
      }
      if (this.responseType === "json") {
        return JSON.stringify(this.responseValue);
      }
      if (this.responseValue === "blob") {
        return new TextDecoder().decode(this.responseValue);
      }
      return this.responseValue;
    }
    return "";
  }
  getAllResponseHeaders() {
    if (this.errored || this.readyState && this.readyState < this.HEADERS_RECEIVED || !this.responseHeaders) return "";
    return Object.entries(this.responseHeaders).map(([header, value]) => `${header}: ${value}`).join("\r\n");
  }
  getResponseHeader(headerName) {
    return this.responseHeaders?.get(headerName.toLowerCase()) || null;
  }
};

// src/trace.ts
var import_api = require("@opentelemetry/api");
function withTracing(fn, ctx = {}) {
  if (ctx.beforeRun) {
    const beforeRun = ctx.beforeRun;
    return function(...args) {
      beforeRun(...args);
      return withTracing(fn, { ...ctx, beforeRun: void 0 })(...args);
    };
  }
  if (!config.isInstrumented) {
    return fn;
  }
  const { name, trackArgs = false, attributes, setSpan } = ctx;
  const tracer = import_api.trace.getTracer("default");
  return function(...args) {
    return tracer.startActiveSpan(name || fn.name || "<anonymous>", (span) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }
        if (trackArgs) {
          if (args.length === 1) {
            span.setAttribute("arg", args[0]);
          } else if (args.length > 1) {
            span.setAttribute("args", args);
          }
        }
        const ret = fn(...args);
        if (ret.then) {
          if (setSpan) {
            return ret.then((res) => {
              setSpan(span, ret);
              return res;
            });
          }
          return ret.then((res) => {
            span.setStatus({ code: import_api.SpanStatusCode.OK });
            return res;
          }).catch((err) => {
            span.setStatus({ code: import_api.SpanStatusCode.ERROR, message: String(err) });
            span.recordException(err);
            emitOtelLog({ level: "ERROR", body: err });
            throw err;
          }).finally(() => {
            span.end();
          });
        }
        if (setSpan) {
          setSpan(span, ret);
          return ret;
        }
        span.setStatus({ code: import_api.SpanStatusCode.OK });
        span.end();
        return ret;
      } catch (err) {
        span.setStatus({ code: import_api.SpanStatusCode.ERROR, message: String(err) });
        span.recordException(err);
        emitOtelLog({ level: "ERROR", body: err });
        span.end();
        throw err;
      }
    });
  };
}
__name(withTracing, "withTracing");
function useTracing(fn, ctx = {}) {
  return withTracing(fn, ctx)();
}
__name(useTracing, "useTracing");

// src/instrument.ts
var import_sdk_trace_base = require("@opentelemetry/sdk-trace-base");
var import_sdk_logs = require("@opentelemetry/sdk-logs");
var import_resources = require("@opentelemetry/resources");
var import_api_logs2 = require("@opentelemetry/api-logs");
var import_exporter_logs_otlp_proto = require("@opentelemetry/exporter-logs-otlp-proto");
var import_exporter_trace_otlp_http = require("@opentelemetry/exporter-trace-otlp-http");
var import_sdk_trace_web = require("@opentelemetry/sdk-trace-web");
var import_context_zone = require("@opentelemetry/context-zone");
var import_instrumentation = require("@opentelemetry/instrumentation");
var import_auto_instrumentations_web = require("@opentelemetry/auto-instrumentations-web");
var import_propagator_b3 = require("@opentelemetry/propagator-b3");
var import_semantic_conventions2 = require("@opentelemetry/semantic-conventions");
var import_lodash2 = __toESM(require("lodash"));

// src/console.ts
var console_exports = {};
__export(console_exports, {
  instrumentConsole: () => instrumentConsole
});
var R = __toESM(require("ramda"));
var import_util = __toESM(require("util"));
function instrumentConsole() {
  if (console._instrumented) return;
  const { log, error, warn, info, debug, timeLog, timeEnd } = console;
  [
    { name: "log", logger: log, level: "INFO" },
    { name: "error", logger: error, level: "ERROR" },
    { name: "warn", logger: warn, level: "WARN" },
    { name: "info", logger: info, level: "INFO" },
    { name: "debug", logger: debug, level: "DEBUG" },
    { name: "timeLog", logger: timeLog, level: "INFO" },
    { name: "timeEnd", logger: timeEnd, level: "INFO" }
  ].forEach(({ name, logger, level }) => {
    console[name] = function(...content) {
      logger(...content);
      const contentWoCtx = content.filter((c) => !isObject(c) || !("ctx" in c || "authCtx" in c));
      const contentCtx = R.mergeAll(
        content.filter((c) => isObject(c) && ("ctx" in c || "authCtx" in c)).map((c) => {
          if (c.ctx) return c.ctx;
          if (c.authCtx) return c.authCtx;
          return {};
        })
      );
      const prettyContentWoCtx = contentWoCtx.map((c) => {
        if (typeof c === "object") {
          try {
            return import_util.default.inspect(c);
          } catch {
          }
        }
        return c;
      });
      emitOtelLog({ level, body: prettyContentWoCtx.join(" "), attributes: contentCtx });
    };
  });
  console._instrumented = true;
}
__name(instrumentConsole, "instrumentConsole");
function isObject(obj) {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}
__name(isObject, "isObject");

// src/instrument.ts
function defaultInstrumentConfig() {
  return {
    baseUrl: process.env.IUDEX_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "https://api.iudex.ai",
    iudexApiKey: process.env.IUDEX_API_KEY,
    publicWriteOnlyIudexApiKey: process.env.PUBLIC_WRITE_ONLY_IUDEX_API_KEY || process.env.NEXT_PUBLIC_WRITE_ONLY_IUDEX_API_KEY,
    serviceName: process.env.OTEL_SERVICE_NAME || "unknown-service",
    gitCommit: process.env.GIT_COMMIT,
    githubUrl: process.env.GITHUB_URL,
    env: process.env.NODE_ENV,
    headers: {},
    settings: {}
  };
}
__name(defaultInstrumentConfig, "defaultInstrumentConfig");
function instrument(instrumentConfig = {}) {
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
    settings
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };
  if (!publicWriteOnlyIudexApiKey && !iudexApiKey) {
    console.warn(
      `The PUBLIC_WRITE_ONLY_IUDEX_API_KEY environment variable is missing or empty. Provide PUBLIC_WRITE_ONLY_IUDEX_API_KEY to the environment on load OR instrument with the publicWriteOnlyIudexApiKey option. Example: \`instrument{ publicWriteOnlyIudexApiKey: 'My_API_Key' })\``
    );
    return;
  }
  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });
  const resource = buildResource({ serviceName, instanceId, gitCommit, githubUrl, env });
  const logExporter = new import_exporter_logs_otlp_proto.OTLPLogExporter({ url: baseUrl + "/v1/logs", headers });
  const logRecordProcessor = new import_sdk_logs.SimpleLogRecordProcessor(logExporter);
  const loggerProvider = new import_sdk_logs.LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  import_api_logs2.logs.setGlobalLoggerProvider(loggerProvider);
  const traceExporter = new import_exporter_trace_otlp_http.OTLPTraceExporter({ url: baseUrl + "/v1/traces", headers });
  const spanProcessor = new import_sdk_trace_base.SimpleSpanProcessor(traceExporter);
  const provider = new import_sdk_trace_web.WebTracerProvider();
  provider.addSpanProcessor(spanProcessor);
  provider.register({
    contextManager: new import_context_zone.ZoneContextManager(),
    propagator: new import_propagator_b3.B3Propagator()
  });
  const instrumentationConfigMap = {};
  if (!settings.instrumentWindow || settings.instrumentWindow != void 0) {
    instrumentationConfigMap["@opentelemetry/instrumentation-user-interaction"] = { enabled: false };
    instrumentationConfigMap["@opentelemetry/instrumentation-document-load"] = { enabled: false };
  }
  if (!settings.instrumentXhr || settings.instrumentXhr != void 0) {
    instrumentationConfigMap["@opentelemetry/instrumentation-xml-http-request"] = { enabled: false };
  }
  (0, import_instrumentation.registerInstrumentations)({
    instrumentations: [(0, import_auto_instrumentations_web.getWebAutoInstrumentations)(instrumentationConfigMap)]
  });
  if (settings.instrumentConsole || settings.instrumentConsole == void 0) {
    instrumentConsole();
  }
  config.isInstrumented = true;
}
__name(instrument, "instrument");
function buildHeaders(instrumentConfig) {
  const {
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders
  } = { ...defaultInstrumentConfig, ...instrumentConfig };
  const headers = { ...configHeaders };
  if (publicWriteOnlyIudexApiKey) {
    headers["x-write-only-api-key"] = publicWriteOnlyIudexApiKey;
  }
  if (iudexApiKey) {
    headers["x-api-key"] = iudexApiKey;
  }
  return headers;
}
__name(buildHeaders, "buildHeaders");
function buildResource(instrumentConfig) {
  const {
    serviceName,
    instanceId,
    gitCommit,
    githubUrl,
    env
  } = { ...defaultInstrumentConfig, ...instrumentConfig };
  return new import_resources.Resource(import_lodash2.default.omitBy({
    [import_semantic_conventions2.SEMRESATTRS_SERVICE_NAME]: serviceName,
    [import_semantic_conventions2.SEMRESATTRS_SERVICE_INSTANCE_ID]: instanceId,
    "git.commit": gitCommit,
    "github.url": githubUrl,
    "env": env
  }, import_lodash2.default.isNil));
}
__name(buildResource, "buildResource");
function lazyObj(instantiator) {
  let inst;
  return new Proxy({}, {
    get(target, prop, reciever) {
      if (inst == void 0) {
        inst = instantiator();
      }
      reciever.get = (target2, prop2) => target2[prop2];
      return inst[prop];
    }
  });
}
__name(lazyObj, "lazyObj");

// src/vercel.ts
var import_exporter_logs_otlp_proto2 = require("@opentelemetry/exporter-logs-otlp-proto");
var import_sdk_logs2 = require("@opentelemetry/sdk-logs");
var import_exporter_trace_otlp_http2 = require("@opentelemetry/exporter-trace-otlp-http");
var import_sdk_trace_base2 = require("@opentelemetry/sdk-trace-base");
function registerOTelOptions(optionsOrServiceName) {
  const options = typeof optionsOrServiceName === "string" ? { serviceName: optionsOrServiceName } : optionsOrServiceName || {};
  const {
    baseUrl,
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders
  } = { ...defaultInstrumentConfig, ...options };
  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });
  const logExporter = new import_exporter_logs_otlp_proto2.OTLPLogExporter({ url: baseUrl + "/v1/logs", headers });
  const logRecordProcessor = new import_sdk_logs2.SimpleLogRecordProcessor(logExporter);
  const traceExporter = new import_exporter_trace_otlp_http2.OTLPTraceExporter({ url: baseUrl + "/v1/traces", headers });
  const spanProcessor = new import_sdk_trace_base2.SimpleSpanProcessor(traceExporter);
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
  if (settings.instrumentConsole || settings.instrumentConsole == void 0) {
    instrumentConsole();
  }
  config.isInstrumented = true;
  return options;
}
__name(registerOTelOptions, "registerOTelOptions");

// src/cloudflare-worker.ts
var cloudflare_worker_exports = {};
__export(cloudflare_worker_exports, {
  trace: () => trace2,
  withTracing: () => withTracing2,
  workersConfigSettings: () => workersConfigSettings
});
var import_lodash3 = __toESM(require("lodash"));
var workersConfigSettings = { instrumentWindow: false, instrumentXhr: false };
function withTracing2(fn, ctx = {}, config2 = {}) {
  if (!globalThis.XMLHttpRequest) globalThis.XMLHttpRequest = XMLHttpRequest;
  if (!ctx.beforeRun) ctx.beforeRun = (arg1, env, ctx2) => {
    config.workerEvent = ctx2;
    if (config2.settings == null) config2.settings = workersConfigSettings;
    if (config2.settings.instrumentWindow == null) config2.settings.instrumentWindow = false;
    if (config2.settings.instrumentXhr == null) config2.settings.instrumentXhr = false;
    if (config2.iudexApiKey == null) config2.iudexApiKey = env.IUDEX_API_KEY;
    instrument(config2);
  };
  return withTracing(fn, ctx);
}
__name(withTracing2, "withTracing");
function trace2(exportedHandler, ctx, config2 = {}) {
  return import_lodash3.default.mapValues(exportedHandler, (handler, key) => {
    if (!handler) return;
    return withTracing2(
      handler,
      { ...ctx, name: `${ctx.name}.${key}` },
      config2
    );
  });
}
__name(trace2, "trace");

// src/index.ts
function trackAttribute(key, value) {
  const activeSpan = import_api2.trace.getActiveSpan();
  activeSpan?.setAttribute(key, value);
}
__name(trackAttribute, "trackAttribute");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dispatch,
  XMLHttpRequest,
  buildHeaders,
  buildResource,
  config,
  convertSeverityTextToNumber,
  convertSeverityValuesToLevel,
  defaultInstrumentConfig,
  emitOtelLog,
  flattenObject,
  getCallerInfo,
  instrument,
  iudexCloudflare,
  iudexConsole,
  lazyObj,
  nativeConsole,
  registerOTelOptions,
  trackAttribute,
  useTracing,
  withTracing
});
