var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import { SpanStatusCode as SpanStatusCode3, trace as trace5 } from "@opentelemetry/api";

// src/utils.ts
import {
  SEMATTRS_CODE_FILEPATH,
  SEMATTRS_CODE_FUNCTION,
  SEMATTRS_CODE_LINENO
} from "@opentelemetry/semantic-conventions";
import { logs } from "@opentelemetry/api-logs";
import _ from "lodash";
var config = {
  isInstrumented: false,
  nativeConsole: { ...console },
  nativeFetch: fetch.bind(globalThis)
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
function flattenObject(obj, parentKey = "", result = {}, seen = /* @__PURE__ */ new Set(), maxObjectKeys = 30, maxDepth = 4) {
  if (!obj) return;
  if (maxDepth < 0) {
    result[parentKey] = "<max depth exceeded>";
    return;
  }
  Object.entries(obj).forEach(([key, value], i) => {
    if (i === maxObjectKeys) {
      result[`${parentKey}.${key}._max_keys_exceeded`] = "<max keys exceeded>";
      return;
    }
    if (i > maxObjectKeys) {
      return;
    }
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (seen.has(value)) {
      result[newKey] = "<circular>";
      return;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(obj[key])) {
      seen.add(value);
      flattenObject(value, newKey, result, seen, maxObjectKeys, maxDepth - 1);
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
      [SEMATTRS_CODE_FILEPATH]: filePath,
      [SEMATTRS_CODE_LINENO]: lineNum,
      [SEMATTRS_CODE_FUNCTION]: caller
    });
  }
  if (config.sessionProvider) {
    attrs.session = config.sessionProvider.getActiveSession();
  }
  const otelLogger = config.loggerProvider?.getLogger("default") || logs.getLogger("default");
  otelLogger.emit({
    severityNumber: severityNumber || convertSeverityTextToNumber(level.toUpperCase()),
    severityText: level.toUpperCase(),
    body,
    attributes: _.omitBy(attrs, _.isNil)
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
var XMLHttpRequest2 = class extends Dispatch {
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
import {
  SpanStatusCode,
  trace
} from "@opentelemetry/api";
function withTracing(fn, ctx = {}) {
  return function(...args) {
    const { name, trackArgs = true, maxArgKeys, maxArgDepth, attributes, setSpan, setArgs } = ctx;
    const tracer = trace.getTracer("default");
    if (!config.isInstrumented) {
      return fn(...args);
    }
    if (ctx.beforeRun) {
      ctx.beforeRun(...args);
    }
    return tracer.startActiveSpan(name || fn.name || "<anonymous>", (span) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }
        if (trackArgs && !setArgs) {
          if (args.length === 1) {
            if (args[0] != null && typeof args[0] === "object") {
              const flatObj = flattenObject(args[0], "", {}, /* @__PURE__ */ new Set(), maxArgKeys, maxArgDepth);
              flatObj && Object.entries(flatObj).forEach(([key, value]) => {
                span.setAttribute(key, value);
              });
            } else if (args[0] == null) {
              span.setAttribute("args.0", `<${args[0]}>`);
            } else {
              span.setAttribute("args.0", args[0]);
            }
          } else if (args.length > 1) {
            const flatObjs = flattenObject(args, "", {}, /* @__PURE__ */ new Set(), maxArgKeys, maxArgDepth);
            flatObjs && Object.entries(flatObjs).forEach(([key, value]) => {
              span.setAttribute(`args.${key}`, value);
            });
          }
        }
        if (setArgs) {
          setArgs(span, args);
        }
        const ret = fn(...args);
        if (ret.then) {
          if (setSpan) {
            setSpan(span, ret);
            return ret;
          }
          return ret.then((res) => {
            return res;
          }).catch((err) => {
            span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
            span.recordException(err);
            span.setAttribute("exception.message", err.message);
            span.setAttribute("exception.stacktrace", err.stack);
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
        span.end();
        return ret;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        span.recordException(err);
        span.setAttribute("exception.message", err.message);
        err.stack && span.setAttribute("exception.stacktrace", err.stack || "");
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
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";

// src/instrumentations/fetch-instrumentation.ts
import * as api from "@opentelemetry/api";
import {
  isWrapped,
  InstrumentationBase,
  safeExecuteInTheMiddle
} from "@opentelemetry/instrumentation";
import * as core from "@opentelemetry/core";
import * as web from "@opentelemetry/sdk-trace-web";
import { AttributeNames } from "@opentelemetry/instrumentation-fetch/build/src/enums/AttributeNames";
import {
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_HOST,
  SEMATTRS_HTTP_USER_AGENT,
  SEMATTRS_HTTP_SCHEME,
  SEMATTRS_HTTP_URL,
  SEMATTRS_HTTP_METHOD
} from "@opentelemetry/semantic-conventions";
import { VERSION } from "@opentelemetry/instrumentation-fetch/build/src/version";
import { _globalThis } from "@opentelemetry/core";
var OBSERVER_WAIT_TIME_MS = 300;
var isNode = typeof process === "object" && process.release?.name === "node";
var FetchInstrumentation = class extends InstrumentationBase {
  static {
    __name(this, "FetchInstrumentation");
  }
  component = "fetch";
  version = VERSION;
  moduleName = this.component;
  _usedResources = /* @__PURE__ */ new WeakSet();
  _tasksCount = 0;
  constructor(config2 = {}) {
    super("@opentelemetry/instrumentation-fetch", VERSION, config2);
  }
  init() {
  }
  /**
   * Add cors pre flight child span
   * @param span
   * @param corsPreFlightRequest
   */
  _addChildSpan(span, corsPreFlightRequest) {
    const childSpan = this.tracer.startSpan(
      "CORS Preflight",
      {
        startTime: corsPreFlightRequest[web.PerformanceTimingNames.FETCH_START]
      },
      api.trace.setSpan(api.context.active(), span)
    );
    if (!this.getConfig().ignoreNetworkEvents) {
      web.addSpanNetworkEvents(childSpan, corsPreFlightRequest);
    }
    childSpan.end(
      corsPreFlightRequest[web.PerformanceTimingNames.RESPONSE_END]
    );
  }
  /**
   * Adds more attributes to span just before ending it
   * @param span
   * @param response
   */
  _addFinalSpanAttributes(span, response) {
    const parsedUrl = web.parseUrl(response.url);
    span.setAttribute(SEMATTRS_HTTP_STATUS_CODE, response.status);
    if (response.statusText != null) {
      span.setAttribute(AttributeNames.HTTP_STATUS_TEXT, response.statusText);
    }
    span.setAttribute(SEMATTRS_HTTP_HOST, parsedUrl.host);
    span.setAttribute(
      SEMATTRS_HTTP_SCHEME,
      parsedUrl.protocol.replace(":", "")
    );
    if (typeof navigator !== "undefined") {
      span.setAttribute(SEMATTRS_HTTP_USER_AGENT, navigator.userAgent);
    }
  }
  /**
   * Add headers
   * @param options
   * @param spanUrl
   */
  _addHeaders(options, spanUrl) {
    if (!web.shouldPropagateTraceHeaders(
      spanUrl,
      this.getConfig().propagateTraceHeaderCorsUrls
    )) {
      const headers = {};
      api.propagation.inject(api.context.active(), headers);
      if (Object.keys(headers).length > 0) {
        this._diag.debug("headers inject skipped due to CORS policy");
      }
      return;
    }
    const sessionId = config.sessionProvider?.getActiveSession()?.id;
    let baggage = api.propagation.getActiveBaggage() || api.propagation.createBaggage({});
    if (sessionId) {
      baggage = baggage.setEntry("session.id", { value: sessionId });
    }
    const ctx = api.propagation.setBaggage(api.context.active(), baggage);
    api.context.with(ctx, () => {
      if (options instanceof Request) {
        api.propagation.inject(api.context.active(), options.headers, {
          set: /* @__PURE__ */ __name((h, k, v) => h.set(k, typeof v === "string" ? v : String(v)), "set")
        });
      } else if (options.headers instanceof Headers) {
        api.propagation.inject(api.context.active(), options.headers, {
          set: /* @__PURE__ */ __name((h, k, v) => h.set(k, typeof v === "string" ? v : String(v)), "set")
        });
      } else if (options.headers instanceof Map) {
        api.propagation.inject(api.context.active(), options.headers, {
          set: /* @__PURE__ */ __name((h, k, v) => h.set(k, typeof v === "string" ? v : String(v)), "set")
        });
      } else {
        const headers = {};
        api.propagation.inject(api.context.active(), headers);
        options.headers = Object.assign({}, headers, options.headers || {});
      }
    });
  }
  /**
   * Clears the resource timings and all resources assigned with spans
   *     when {@link FetchPluginConfig.clearTimingResources} is
   *     set to true (default false)
   * @private
   */
  _clearResources() {
    if (this._tasksCount === 0 && this.getConfig().clearTimingResources) {
      performance.clearResourceTimings();
      this._usedResources = /* @__PURE__ */ new WeakSet();
    }
  }
  /**
   * Creates a new span
   * @param url
   * @param options
   */
  _createSpan(url, options = {}) {
    if (core.isUrlIgnored(url, this.getConfig().ignoreUrls)) {
      this._diag.debug("ignoring span as url matches ignored url");
      return;
    }
    const method = (options.method || "GET").toUpperCase();
    const spanName = `HTTP ${method}`;
    return this.tracer.startSpan(spanName, {
      kind: api.SpanKind.CLIENT,
      attributes: {
        [AttributeNames.COMPONENT]: this.moduleName,
        [SEMATTRS_HTTP_METHOD]: method,
        [SEMATTRS_HTTP_URL]: url
      }
    });
  }
  /**
   * Finds appropriate resource and add network events to the span
   * @param span
   * @param resourcesObserver
   * @param endTime
   */
  _findResourceAndAddNetworkEvents(span, resourcesObserver, endTime) {
    let resources = resourcesObserver.entries;
    if (!resources.length) {
      if (!performance.getEntriesByType) {
        return;
      }
      resources = performance.getEntriesByType(
        "resource"
      );
    }
    const resource = web.getResource(
      resourcesObserver.spanUrl,
      resourcesObserver.startTime,
      endTime,
      resources,
      this._usedResources,
      "fetch"
    );
    if (resource.mainRequest) {
      const mainRequest = resource.mainRequest;
      this._markResourceAsUsed(mainRequest);
      const corsPreFlightRequest = resource.corsPreFlightRequest;
      if (corsPreFlightRequest) {
        this._addChildSpan(span, corsPreFlightRequest);
        this._markResourceAsUsed(corsPreFlightRequest);
      }
      if (!this.getConfig().ignoreNetworkEvents) {
        web.addSpanNetworkEvents(span, mainRequest);
      }
    }
  }
  /**
   * Marks certain [resource]{@link PerformanceResourceTiming} when information
   * from this is used to add events to span.
   * This is done to avoid reusing the same resource again for next span
   * @param resource
   */
  _markResourceAsUsed(resource) {
    this._usedResources.add(resource);
  }
  /**
   * Finish span, add attributes, network events etc.
   * @param span
   * @param spanData
   * @param response
   */
  _endSpan(span, spanData, response) {
    const endTime = core.millisToHrTime(Date.now());
    const performanceEndTime = core.hrTime();
    this._addFinalSpanAttributes(span, response);
    setTimeout(() => {
      spanData.observer?.disconnect();
      this._findResourceAndAddNetworkEvents(span, spanData, performanceEndTime);
      this._tasksCount--;
      this._clearResources();
      span.end(endTime);
    }, OBSERVER_WAIT_TIME_MS);
  }
  /**
   * Patches the constructor of fetch
   */
  _patchConstructor() {
    return (original) => {
      const plugin = this;
      return /* @__PURE__ */ __name(function patchConstructor(...args) {
        const self = this;
        const url = web.parseUrl(
          args[0] instanceof Request ? args[0].url : String(args[0])
        ).href;
        const options = args[0] instanceof Request ? args[0] : args[1] || {};
        const createdSpan = plugin._createSpan(url, options);
        if (!createdSpan) {
          return original.apply(this, args);
        }
        const spanData = plugin._prepareSpanData(url);
        function endSpanOnError(span, error) {
          plugin._applyAttributesAfterFetch(span, options, error);
          plugin._endSpan(span, spanData, {
            status: error.status || 0,
            statusText: error.message,
            url
          });
        }
        __name(endSpanOnError, "endSpanOnError");
        function endSpanOnSuccess(span, response) {
          plugin._applyAttributesAfterFetch(span, options, response);
          if (response.status >= 200 && response.status < 400) {
            plugin._endSpan(span, spanData, response);
          } else {
            plugin._endSpan(span, spanData, {
              status: response.status,
              statusText: response.statusText,
              url
            });
          }
        }
        __name(endSpanOnSuccess, "endSpanOnSuccess");
        function onSuccess(span, resolve, response) {
          try {
            const resClone = response.clone();
            const resClone4Hook = response.clone();
            const body = resClone.body;
            if (body) {
              const reader = body.getReader();
              const read = /* @__PURE__ */ __name(() => {
                reader.read().then(
                  ({ done }) => {
                    if (done) {
                      endSpanOnSuccess(span, resClone4Hook);
                    } else {
                      read();
                    }
                  },
                  (error) => {
                    endSpanOnError(span, error);
                  }
                );
              }, "read");
              read();
            } else {
              endSpanOnSuccess(span, response);
            }
          } finally {
            resolve(response);
          }
        }
        __name(onSuccess, "onSuccess");
        function onError(span, reject, error) {
          try {
            endSpanOnError(span, error);
          } finally {
            reject(error);
          }
        }
        __name(onError, "onError");
        return new Promise((resolve, reject) => {
          return api.context.with(
            api.trace.setSpan(api.context.active(), createdSpan),
            () => {
              plugin._addHeaders(options, url);
              plugin._tasksCount++;
              return original.apply(
                self,
                options instanceof Request ? [options] : [url, options]
              ).then(
                onSuccess.bind(self, createdSpan, resolve),
                onError.bind(self, createdSpan, reject)
              );
            }
          );
        });
      }, "patchConstructor");
    };
  }
  _applyAttributesAfterFetch(span, request, result) {
    const applyCustomAttributesOnSpan = this.getConfig().applyCustomAttributesOnSpan;
    if (applyCustomAttributesOnSpan) {
      safeExecuteInTheMiddle(
        () => applyCustomAttributesOnSpan(span, request, result),
        (error) => {
          if (!error) {
            return;
          }
          this._diag.error("applyCustomAttributesOnSpan", error);
        },
        true
      );
    }
  }
  /**
   * Prepares a span data - needed later for matching appropriate network
   *     resources
   * @param spanUrl
   */
  _prepareSpanData(spanUrl) {
    const startTime = core.hrTime();
    const entries = [];
    if (typeof PerformanceObserver !== "function") {
      return { entries, startTime, spanUrl };
    }
    const observer = new PerformanceObserver((list) => {
      const perfObsEntries = list.getEntries();
      perfObsEntries.forEach((entry) => {
        if (entry.initiatorType === "fetch" && entry.name === spanUrl) {
          entries.push(entry);
        }
      });
    });
    observer.observe({
      entryTypes: ["resource"]
    });
    return { entries, observer, startTime, spanUrl };
  }
  /**
   * implements enable function
   */
  enable() {
    if (isNode) {
      this._diag.warn(
        "this instrumentation is intended for web usage only, it does not instrument Node.js's fetch()"
      );
      return;
    }
    if (isWrapped(fetch)) {
      this._unwrap(_globalThis, "fetch");
      this._diag.debug("removing previous patch for constructor");
    }
    this._wrap(_globalThis, "fetch", this._patchConstructor());
  }
  /**
   * implements unpatch function
   */
  disable() {
    if (isNode) {
      return;
    }
    this._unwrap(_globalThis, "fetch");
    this._usedResources = /* @__PURE__ */ new WeakSet();
  }
};

// src/instrument.ts
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { Resource as Resource2 } from "@opentelemetry/resources";
import {
  SimpleLogRecordProcessor
} from "@opentelemetry/sdk-logs";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor
} from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_SERVICE_NAME
} from "@opentelemetry/semantic-conventions";
import _2 from "lodash";

// src/instrumentations/console-instrumentation.ts
var console_instrumentation_exports = {};
__export(console_instrumentation_exports, {
  instrumentConsole: () => instrumentConsole
});
import * as R from "ramda";
import util from "util";
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
            return util.inspect(c);
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

// src/instrumentations/user-interaction-instrumentation.ts
import {
  isWrapped as isWrapped2,
  InstrumentationBase as InstrumentationBase2
} from "@opentelemetry/instrumentation";
import * as api2 from "@opentelemetry/api";
import { hrTime as hrTime2 } from "@opentelemetry/core";
import { getElementXPath } from "@opentelemetry/sdk-trace-web";
var PACKAGE_NAME = "iudex-web/instrumentation-user-interaction";
var PACKAGE_VERSION = "0.39.0";
var ZONE_CONTEXT_KEY = "OT_ZONE_CONTEXT";
var EVENT_NAVIGATION_NAME = "Navigation:";
var DEFAULT_EVENT_NAMES = ["click"];
function defaultShouldPreventSpanCreation() {
  return false;
}
__name(defaultShouldPreventSpanCreation, "defaultShouldPreventSpanCreation");
var UserInteractionInstrumentation = class extends InstrumentationBase2 {
  static {
    __name(this, "UserInteractionInstrumentation");
  }
  version = PACKAGE_VERSION;
  moduleName = "user-interaction";
  _spansData = /* @__PURE__ */ new WeakMap();
  _zonePatched;
  // for addEventListener/removeEventListener state
  _wrappedListeners = /* @__PURE__ */ new WeakMap();
  // for event bubbling
  _eventsSpanMap = /* @__PURE__ */ new WeakMap();
  _eventNames;
  _shouldPreventSpanCreation;
  // How to connect event with when react handles it?
  spansByPendingEvent = /* @__PURE__ */ new Map();
  constructor(config2 = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config2);
    this._eventNames = new Set(config2?.eventNames ?? DEFAULT_EVENT_NAMES);
    this._shouldPreventSpanCreation = typeof config2?.shouldPreventSpanCreation === "function" ? config2.shouldPreventSpanCreation : defaultShouldPreventSpanCreation;
  }
  init() {
  }
  /**
   * This will check if last task was timeout and will save the time to
   * fix the user interaction when nothing happens
   * This timeout comes from xhr plugin which is needed to collect information
   * about last xhr main request from observer
   * @param task
   * @param span
   */
  _checkForTimeout(task, span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      if (task.source === "setTimeout") {
        spanData.hrTimeLastTimeout = hrTime2();
      } else if (task.source !== "Promise.then" && task.source !== "setTimeout") {
        spanData.hrTimeLastTimeout = void 0;
      }
    }
  }
  /**
   * Controls whether or not to create a span, based on the event type.
   */
  _allowEventName(eventName) {
    return this._eventNames.has(eventName);
  }
  /**
   * Creates a new span
   * @param element
   * @param eventName
   * @param parentSpan
   */
  _createSpan(element, eventName, parentSpan) {
    if (!(element instanceof HTMLElement)) {
      return void 0;
    }
    if (!element.getAttribute) {
      return void 0;
    }
    if (element.hasAttribute("disabled")) {
      return void 0;
    }
    const isReactEvent = eventName.startsWith("react-");
    if (isReactEvent) {
      eventName = eventName.split("react-", 2)[1];
    }
    if (!this._allowEventName(eventName)) {
      return void 0;
    }
    const xpath = getElementXPath(element, true);
    try {
      const span = this.tracer.startSpan(
        eventName,
        {
          attributes: {
            ["event_type" /* EVENT_TYPE */]: eventName,
            ["target_element" /* TARGET_ELEMENT */]: element.tagName,
            ["target_xpath" /* TARGET_XPATH */]: xpath,
            ["http.url" /* HTTP_URL */]: window.location.href
          }
        },
        parentSpan ? api2.trace.setSpan(api2.context.active(), parentSpan) : void 0
      );
      if (this._shouldPreventSpanCreation(eventName, element, span) === true) {
        return void 0;
      }
      this._spansData.set(span, {
        taskCount: 0
      });
      return span;
    } catch (e) {
      this._diag.error("failed to start create new user interaction span", e);
    }
    return void 0;
  }
  /**
   * Decrement number of tasks that left in zone,
   * This is needed to be able to end span when no more tasks left
   * @param span
   */
  _decrementTask(span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      spanData.taskCount--;
      if (spanData.taskCount === 0) {
        this._tryToEndSpan(span, spanData.hrTimeLastTimeout);
      }
    }
  }
  /**
   * Return the current span
   * @param zone
   * @private
   */
  _getCurrentSpan(zone) {
    const context4 = zone.get(ZONE_CONTEXT_KEY);
    if (context4) {
      return api2.trace.getSpan(context4);
    }
    return context4;
  }
  /**
   * Increment number of tasks that are run within the same zone.
   *     This is needed to be able to end span when no more tasks left
   * @param span
   */
  _incrementTask(span) {
    const spanData = this._spansData.get(span);
    if (spanData) {
      spanData.taskCount++;
    }
  }
  /**
   * Returns true iff we should use the patched callback; false if it's already been patched
   */
  addPatchedListener(on, type, listener, wrappedListener) {
    let listener2Type = this._wrappedListeners.get(listener);
    if (!listener2Type) {
      listener2Type = /* @__PURE__ */ new Map();
      this._wrappedListeners.set(listener, listener2Type);
    }
    let element2patched = listener2Type.get(type);
    if (!element2patched) {
      element2patched = /* @__PURE__ */ new Map();
      listener2Type.set(type, element2patched);
    }
    if (element2patched.has(on)) {
      return false;
    }
    element2patched.set(on, wrappedListener);
    return true;
  }
  /**
   * Returns the patched version of the callback (or undefined)
   */
  removePatchedListener(on, type, listener) {
    const listener2Type = this._wrappedListeners.get(listener);
    if (!listener2Type) {
      return void 0;
    }
    const element2patched = listener2Type.get(type);
    if (!element2patched) {
      return void 0;
    }
    const patched = element2patched.get(on);
    if (patched) {
      element2patched.delete(on);
      if (element2patched.size === 0) {
        listener2Type.delete(type);
        if (listener2Type.size === 0) {
          this._wrappedListeners.delete(listener);
        }
      }
    }
    return patched;
  }
  // utility method to deal with the Function|EventListener nature of addEventListener
  _invokeListener(listener, target, args) {
    if (typeof listener === "function") {
      return listener.apply(target, args);
    } else {
      return listener.handleEvent(args[0]);
    }
  }
  /**
   * This patches the addEventListener of HTMLElement to be able to
   * auto instrument the click events
   * This is done when zone is not available
   */
  _patchAddEventListener() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function addEventListenerPatched(type, listener, useCapture) {
        if (!listener) {
          return original.call(this, type, listener, useCapture);
        }
        const once = useCapture && typeof useCapture === "object" && useCapture.once;
        const patchedListener = /* @__PURE__ */ __name(function(...args) {
          let parentSpan;
          const event = args[0];
          let target = event?.target;
          if (event) {
            parentSpan = plugin._eventsSpanMap.get(event);
          }
          if (once) {
            plugin.removePatchedListener(this, type, listener);
          }
          const isReactEvent = event?.currentTarget?.tagName === "REACT";
          if (isReactEvent && event?.currentTarget?.ownerDocument?.activeElement) {
            target = event.currentTarget.ownerDocument.activeElement;
          }
          const span = plugin._createSpan(target, type, parentSpan);
          if (span) {
            if (event) {
              plugin._eventsSpanMap.set(event, span);
            }
            if (isReactEvent && target) {
              const fiberKey = Object.keys(target).find((k) => k.startsWith("__reactFiber$"));
              if (fiberKey) {
                const fiber = target[fiberKey];
                if (fiber._debugSource) {
                  const { fileName, lineNumber, columnNumber } = fiber._debugSource;
                  columnNumber && span.setAttribute("code.column", columnNumber);
                  fileName && span.setAttribute("code.filepath", fileName);
                  lineNumber && span.setAttribute("code.lineno", lineNumber);
                }
                const fibs = getFiberTree(fiber);
                const lineage = getReactRenderLineage(fibs);
                const stackTrace = getReactRenderStackTrace(fibs);
                span.setAttribute("code.stacktrace", stackTrace.slice(0, 10).join("\n"));
                span.setAttribute("code.reacttrace", lineage.join("\n"));
              }
            }
            try {
              return api2.context.with(
                api2.trace.setSpan(api2.context.active(), span),
                () => {
                  const result = plugin._invokeListener(listener, this, args);
                  return result;
                }
              );
            } catch (e) {
              const error = e;
              span.setStatus({ code: api2.SpanStatusCode.ERROR, message: error.message });
              span.recordException(error);
              emitOtelLog({ level: "ERROR", body: error.stack });
              throw e;
            } finally {
              span.end();
            }
          } else {
            return plugin._invokeListener(listener, this, args);
          }
        }, "patchedListener");
        if (plugin.addPatchedListener(this, type, listener, patchedListener)) {
          return original.call(this, type, patchedListener, useCapture);
        }
      }, "addEventListenerPatched");
    };
  }
  /**
   * This patches the removeEventListener of HTMLElement to handle the fact that
   * we patched the original callbacks
   * This is done when zone is not available
   */
  _patchRemoveEventListener() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function removeEventListenerPatched(type, listener, useCapture) {
        const wrappedListener = plugin.removePatchedListener(
          this,
          type,
          listener
        );
        if (wrappedListener) {
          return original.call(this, type, wrappedListener, useCapture);
        } else {
          return original.call(this, type, listener, useCapture);
        }
      }, "removeEventListenerPatched");
    };
  }
  /**
   * Most browser provide event listener api via EventTarget in prototype chain.
   * Exception to this is IE 11 which has it on the prototypes closest to EventTarget:
   *
   * * - has addEventListener in IE
   * ** - has addEventListener in all other browsers
   * ! - missing in IE
   *
   * HTMLElement -> Element -> Node * -> EventTarget **! -> Object
   * Document -> Node * -> EventTarget **! -> Object
   * Window * -> WindowProperties ! -> EventTarget **! -> Object
   */
  _getPatchableEventTargets() {
    return window.EventTarget ? [EventTarget.prototype] : [Node.prototype, Window.prototype];
  }
  /**
   * Patches the history api
   */
  _patchHistoryApi() {
    this._unpatchHistoryApi();
    this._wrap(history, "replaceState", this._patchHistoryMethod());
    this._wrap(history, "pushState", this._patchHistoryMethod());
    this._wrap(history, "back", this._patchHistoryMethod());
    this._wrap(history, "forward", this._patchHistoryMethod());
    this._wrap(history, "go", this._patchHistoryMethod());
  }
  /**
   * Patches the certain history api method
   */
  _patchHistoryMethod() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function patchHistoryMethod(...args) {
        const url = `${location.pathname}${location.hash}${location.search}`;
        const result = original.apply(this, args);
        const urlAfter = `${location.pathname}${location.hash}${location.search}`;
        if (url !== urlAfter) {
          plugin._updateInteractionName(urlAfter);
        }
        return result;
      }, "patchHistoryMethod");
    };
  }
  /**
   * unpatch the history api methods
   */
  _unpatchHistoryApi() {
    if (isWrapped2(history.replaceState)) this._unwrap(history, "replaceState");
    if (isWrapped2(history.pushState)) this._unwrap(history, "pushState");
    if (isWrapped2(history.back)) this._unwrap(history, "back");
    if (isWrapped2(history.forward)) this._unwrap(history, "forward");
    if (isWrapped2(history.go)) this._unwrap(history, "go");
  }
  /**
   * Updates interaction span name
   * @param url
   */
  _updateInteractionName(url) {
    const span = api2.trace.getSpan(api2.context.active());
    if (span && typeof span.updateName === "function") {
      span.updateName(`${EVENT_NAVIGATION_NAME} ${url}`);
    }
  }
  /**
   * Patches zone cancel task - this is done to be able to correctly
   * decrement the number of remaining tasks
   */
  _patchZoneCancelTask() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function patchCancelTask(task) {
        const currentZone = Zone.current;
        const currentSpan = plugin._getCurrentSpan(currentZone);
        if (currentSpan && plugin._shouldCountTask(task, currentZone)) {
          plugin._decrementTask(currentSpan);
        }
        return original.call(this, task);
      }, "patchCancelTask");
    };
  }
  /**
   * Patches zone schedule task - this is done to be able to correctly
   * increment the number of tasks running within current zone but also to
   * save time in case of timeout running from xhr plugin when waiting for
   * main request from PerformanceResourceTiming
   */
  _patchZoneScheduleTask() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function patchScheduleTask(task) {
        const currentZone = Zone.current;
        const currentSpan = plugin._getCurrentSpan(currentZone);
        if (currentSpan && plugin._shouldCountTask(task, currentZone)) {
          plugin._incrementTask(currentSpan);
          plugin._checkForTimeout(task, currentSpan);
        }
        return original.call(this, task);
      }, "patchScheduleTask");
    };
  }
  /**
   * Patches zone run task - this is done to be able to create a span when
   * user interaction starts
   * @private
   */
  _patchZoneRunTask() {
    const plugin = this;
    return (original) => {
      return /* @__PURE__ */ __name(function patchRunTask(task, applyThis, applyArgs) {
        const event = Array.isArray(applyArgs) && applyArgs[0] instanceof Event ? applyArgs[0] : void 0;
        const target = event?.target;
        const activeZone = this;
        const span = target ? plugin._createSpan(target, task.eventName) : plugin._getCurrentSpan(this);
        if (target && span) {
          plugin._incrementTask(span);
          const isReactEvent = Object.keys(target).some((k) => k.startsWith("__reactFiber$"));
          if (isReactEvent) {
            plugin._incrementTask(span);
            const spans = plugin.spansByPendingEvent.get(task.eventName) || [];
            spans.push(span);
            plugin.spansByPendingEvent.set(task.eventName, spans);
          }
          return activeZone.run(() => {
            try {
              return api2.context.with(
                api2.trace.setSpan(api2.context.active(), span),
                () => {
                  const currentZone = Zone.current;
                  task._zone = currentZone;
                  return original.call(
                    currentZone,
                    task,
                    applyThis,
                    applyArgs
                  );
                }
              );
            } catch (e) {
              const error = e;
              span.setStatus({ code: api2.SpanStatusCode.ERROR, message: error.message });
              span.recordException(error);
              emitOtelLog({ level: "ERROR", body: error.zoneAwareStack || error.stack });
              throw e;
            } finally {
              plugin._decrementTask(span);
            }
          });
        }
        if (event?.type?.startsWith("react-")) {
          const eventType = event.type.split("react-", 2)[1];
          if (eventType) {
            const spans = plugin.spansByPendingEvent.get(eventType);
            if (spans?.length) {
              const span2 = spans.shift();
              if (span2) {
                return activeZone.run(() => {
                  try {
                    return api2.context.with(
                      api2.trace.setSpan(api2.context.active(), span2),
                      () => {
                        const currentZone = Zone.current;
                        task._zone = currentZone;
                        return original.call(
                          currentZone,
                          task,
                          applyThis,
                          applyArgs
                        );
                      }
                    );
                  } catch (e) {
                    const error = e;
                    span2.setStatus({ code: api2.SpanStatusCode.ERROR, message: error.message });
                    span2.recordException(error);
                    emitOtelLog({ level: "ERROR", body: error.zoneAwareStack || error.stack });
                    throw e;
                  } finally {
                    plugin._decrementTask(span2);
                  }
                });
              }
            }
          }
        }
        try {
          return original.call(activeZone, task, applyThis, applyArgs);
        } catch (e) {
          const error = e;
          span?.setStatus({ code: api2.SpanStatusCode.ERROR, message: error.message });
          span?.recordException(error);
          emitOtelLog({ level: "ERROR", body: error.zoneAwareStack || error.stack });
          throw e;
        } finally {
          if (span && plugin._shouldCountTask(task, activeZone)) {
            plugin._decrementTask(span);
          }
        }
      }, "patchRunTask");
    };
  }
  /**
   * Decides if task should be counted.
   * @param task
   * @param currentZone
   * @private
   */
  _shouldCountTask(task, currentZone) {
    if (task._zone) {
      currentZone = task._zone;
    }
    if (!currentZone || !task.data || task.data.isPeriodic) {
      return false;
    }
    const currentSpan = this._getCurrentSpan(currentZone);
    if (!currentSpan) {
      return false;
    }
    if (!this._spansData.get(currentSpan)) {
      return false;
    }
    return task.type === "macroTask" || task.type === "microTask";
  }
  /**
   * Will try to end span when such span still exists.
   * @param span
   * @param endTime
   * @private
   */
  _tryToEndSpan(span, endTime) {
    if (span) {
      const spanData = this._spansData.get(span);
      if (spanData) {
        span.end(endTime);
        this._spansData.delete(span);
      }
    }
  }
  /**
   * implements enable function
   */
  enable() {
    const ZoneWithPrototype = this.getZoneWithPrototype();
    this._diag.debug(
      "applying patch to",
      this.moduleName,
      this.version,
      "zone:",
      !!ZoneWithPrototype
    );
    if (ZoneWithPrototype) {
      if (isWrapped2(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "runTask");
        this._diag.debug("removing previous patch from method runTask");
      }
      if (isWrapped2(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "scheduleTask");
        this._diag.debug("removing previous patch from method scheduleTask");
      }
      if (isWrapped2(ZoneWithPrototype.prototype.cancelTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "cancelTask");
        this._diag.debug("removing previous patch from method cancelTask");
      }
      this._zonePatched = true;
      this._wrap(
        ZoneWithPrototype.prototype,
        "runTask",
        this._patchZoneRunTask()
      );
      this._wrap(
        ZoneWithPrototype.prototype,
        "scheduleTask",
        this._patchZoneScheduleTask()
      );
      this._wrap(
        ZoneWithPrototype.prototype,
        "cancelTask",
        this._patchZoneCancelTask()
      );
    } else {
      this._zonePatched = false;
      const targets = this._getPatchableEventTargets();
      targets.forEach((target) => {
        if (isWrapped2(target.addEventListener)) {
          this._unwrap(target, "addEventListener");
          this._diag.debug(
            "removing previous patch from method addEventListener"
          );
        }
        if (isWrapped2(target.removeEventListener)) {
          this._unwrap(target, "removeEventListener");
          this._diag.debug(
            "removing previous patch from method removeEventListener"
          );
        }
        this._wrap(target, "addEventListener", this._patchAddEventListener());
        this._wrap(
          target,
          "removeEventListener",
          this._patchRemoveEventListener()
        );
      });
    }
    this._patchHistoryApi();
  }
  /**
   * implements unpatch function
   */
  disable() {
    const ZoneWithPrototype = this.getZoneWithPrototype();
    this._diag.debug(
      "removing patch from",
      this.moduleName,
      this.version,
      "zone:",
      !!ZoneWithPrototype
    );
    if (ZoneWithPrototype && this._zonePatched) {
      if (isWrapped2(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "runTask");
      }
      if (isWrapped2(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "scheduleTask");
      }
      if (isWrapped2(ZoneWithPrototype.prototype.cancelTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "cancelTask");
      }
    } else {
      const targets = this._getPatchableEventTargets();
      targets.forEach((target) => {
        if (isWrapped2(target.addEventListener)) {
          this._unwrap(target, "addEventListener");
        }
        if (isWrapped2(target.removeEventListener)) {
          this._unwrap(target, "removeEventListener");
        }
      });
    }
    this._unpatchHistoryApi();
  }
  /**
   * returns Zone
   */
  getZoneWithPrototype() {
    const _window = window;
    return _window.Zone;
  }
};
function getFiberTree(fiber) {
  return fiber ? [fiber, ...getFiberTree(fiber.return)] : [];
}
__name(getFiberTree, "getFiberTree");
function getReactRenderLineage(fibers) {
  return fibers.map((f) => {
    if (typeof f.type === "string") return f.type;
    if (f.type && typeof f.type === "function") return f.type.name;
  }).filter((e) => e);
}
__name(getReactRenderLineage, "getReactRenderLineage");
function getReactRenderStackTrace(fibers) {
  return fibers.map((f) => f._debugSource).filter((e) => e).map((d) => `${d.fileName}:${d.lineNumber}:${d.columnNumber}`);
}
__name(getReactRenderStackTrace, "getReactRenderStackTrace");

// src/opentelemetry/logger-provider.ts
import { context as context3, diag as diag2 } from "@opentelemetry/api";
import { NOOP_LOGGER } from "@opentelemetry/api-logs";
import { LogRecord } from "@opentelemetry/sdk-logs";
import {
  BindOnceFuture,
  callWithTimeout,
  DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  getEnv,
  getEnvWithoutDefaults
} from "@opentelemetry/core";
import {
  LoggerProviderSharedState
} from "@opentelemetry/sdk-logs/build/src/internal/LoggerProviderSharedState.js";
import { Resource } from "@opentelemetry/resources";
var DEFAULT_LOGGER_NAME = "unknown";
var LoggerProvider2 = class {
  static {
    __name(this, "LoggerProvider");
  }
  _shutdownOnce;
  _sharedState;
  constructor(config2 = {}) {
    const mergedConfig = merge(loadDefaultConfig(), config2);
    const resource = Resource.default().merge(
      mergedConfig.resource ?? Resource.empty()
    );
    this._sharedState = new LoggerProviderSharedState(
      resource,
      mergedConfig.forceFlushTimeoutMillis,
      reconfigureLimits(mergedConfig.logRecordLimits)
    );
    this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
  }
  /**
   * Get a logger with the configuration of the LoggerProvider.
   */
  getLogger(name, version, options) {
    if (this._shutdownOnce.isCalled) {
      diag2.warn("A shutdown LoggerProvider cannot provide a Logger");
      return NOOP_LOGGER;
    }
    if (!name) {
      diag2.warn("Logger requested without instrumentation scope name.");
    }
    const loggerName = name || DEFAULT_LOGGER_NAME;
    const key = `${loggerName}@${version || ""}:${options?.schemaUrl || ""}`;
    if (!this._sharedState.loggers.has(key)) {
      this._sharedState.loggers.set(
        key,
        new Logger(
          { name: loggerName, version, schemaUrl: options?.schemaUrl },
          this._sharedState
        )
      );
    }
    return this._sharedState.loggers.get(key);
  }
  /**
   * Adds a new {@link LogRecordProcessor} to this logger.
   * @param processor the new LogRecordProcessor to be added.
   */
  addLogRecordProcessor(processor) {
    if (this._sharedState.registeredLogRecordProcessors.length === 0) {
      this._sharedState.activeProcessor.shutdown().catch(
        (err) => diag2.error(
          "Error while trying to shutdown current log record processor",
          err
        )
      );
    }
    this._sharedState.registeredLogRecordProcessors.push(processor);
    this._sharedState.activeProcessor = new MultiLogRecordProcessor(
      this._sharedState.registeredLogRecordProcessors,
      this._sharedState.forceFlushTimeoutMillis
    );
  }
  /**
   * Notifies all registered LogRecordProcessor to flush any buffered data.
   *
   * Returns a promise which is resolved when all flushes are complete.
   */
  forceFlush() {
    if (this._shutdownOnce.isCalled) {
      diag2.warn("invalid attempt to force flush after LoggerProvider shutdown");
      return this._shutdownOnce.promise;
    }
    return this._sharedState.activeProcessor.forceFlush();
  }
  /**
   * Flush all buffered data and shut down the LoggerProvider and all registered
   * LogRecordProcessor.
   *
   * Returns a promise which is resolved when all flushes are complete.
   */
  shutdown() {
    if (this._shutdownOnce.isCalled) {
      diag2.warn("shutdown may only be called once per LoggerProvider");
      return this._shutdownOnce.promise;
    }
    return this._shutdownOnce.call();
  }
  _shutdown() {
    return this._sharedState.activeProcessor.shutdown();
  }
};
var MultiLogRecordProcessor = class {
  constructor(processors, forceFlushTimeoutMillis) {
    this.processors = processors;
    this.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
  }
  static {
    __name(this, "MultiLogRecordProcessor");
  }
  async forceFlush() {
    const timeout = this.forceFlushTimeoutMillis;
    await Promise.all(
      this.processors.map(
        (processor) => callWithTimeout(processor.forceFlush(), timeout)
      )
    );
  }
  onEmit(logRecord, context4) {
    this.processors.forEach((processors) => processors.onEmit(logRecord, context4));
  }
  async shutdown() {
    await Promise.all(this.processors.map((processor) => processor.shutdown()));
  }
};
function loadDefaultConfig() {
  return {
    forceFlushTimeoutMillis: 3e4,
    logRecordLimits: {
      attributeValueLengthLimit: getEnv().OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: getEnv().OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT
    },
    includeTraceContext: true
  };
}
__name(loadDefaultConfig, "loadDefaultConfig");
function reconfigureLimits(logRecordLimits) {
  const parsedEnvConfig = getEnvWithoutDefaults();
  return {
    attributeCountLimit: logRecordLimits.attributeCountLimit ?? parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT ?? parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT ?? DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    attributeValueLengthLimit: logRecordLimits.attributeValueLengthLimit ?? parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT ?? parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT ?? DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT
  };
}
__name(reconfigureLimits, "reconfigureLimits");
var Logger = class {
  constructor(instrumentationScope, _sharedState) {
    this.instrumentationScope = instrumentationScope;
    this._sharedState = _sharedState;
  }
  static {
    __name(this, "Logger");
  }
  emit(logRecord) {
    const currentContext = logRecord.context || context3.active();
    const logRecordInstance = new LogRecord(
      this._sharedState,
      this.instrumentationScope,
      {
        context: currentContext,
        ...logRecord
      }
    );
    this._sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
    logRecordInstance._makeReadonly();
  }
};
function isObject2(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
__name(isObject2, "isObject");
function merge(target, source) {
  let output = Object.assign({}, target);
  if (isObject2(target) && isObject2(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject2(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          const targetVal = target[key];
          const sourceVal = source[key];
          if (isObject2(targetVal) && isObject2(sourceVal)) {
            output[key] = merge(targetVal, sourceVal);
          }
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
__name(merge, "merge");

// src/opentelemetry/redact-log-processor.ts
var RedactLogProcessor = class {
  constructor(redact) {
    this.redact = redact;
    this.redactFn = typeof redact === "function" ? redact : (logRecord) => {
      if (typeof logRecord.body === "string") {
        logRecord.setBody(logRecord.body.replace(redact, "REDACTED"));
      }
    };
  }
  static {
    __name(this, "RedactLogProcessor");
  }
  redactFn;
  onEmit(logRecord) {
    this.redactFn(logRecord);
  }
  forceFlush() {
    return Promise.resolve();
  }
  shutdown() {
    return Promise.resolve();
  }
};

// src/patches/patch-xmlhttprequest.ts
function patchXmlHttpRequestWithCredentials(otelBaseUrl, withCredentials) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async = true, username, password) {
    origOpen.call(this, method, url, async, username, password);
    if (!withCredentials) return;
    const urlString = typeof url === "string" ? url : url.toString();
    if (urlString.includes(otelBaseUrl)) {
      this.withCredentials = withCredentials;
    }
  };
}
__name(patchXmlHttpRequestWithCredentials, "patchXmlHttpRequestWithCredentials");

// src/sessions/safeCuid.ts
var cuid;
if (typeof window !== "undefined" && window.navigator) {
  cuid = __require("cuid");
} else {
  cuid = /* @__PURE__ */ __name(() => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 5);
    return `${timestamp}-${randomPart}`;
  }, "cuid");
}
var safeCuid_default = cuid;

// src/sessions/utils.ts
var EMAIL_REGEX = new RegExp(
  "[a-zA-Z0-9.!#$%&'*+=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*"
);
var LONG_NUMBER_REGEX = new RegExp("[0-9]{9,16}");
var SSN_REGEX = new RegExp("[0-9]{3}-?[0-9]{2}-?[0-9]{4}");
var PHONE_NUMBER_REGEX = new RegExp(
  "[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}"
);
var CREDIT_CARD_REGEX = new RegExp("[0-9]{4}-?[0-9]{4}-?[0-9]{4}-?[0-9]{4}");
var ADDRESS_REGEX = new RegExp(
  "[0-9]{1,5}.?[0-9]{0,3}s[a-zA-Z]{2,30}s[a-zA-Z]{2,15}"
);
var IP_REGEX = new RegExp("(?:[0-9]{1,3}.){3}[0-9]{1,3}");
var defaultMaskText = /* @__PURE__ */ __name((text) => {
  return text.replace(EMAIL_REGEX, "***@***.***").replace(LONG_NUMBER_REGEX, "************").replace(SSN_REGEX, "***-**-****").replace(PHONE_NUMBER_REGEX, "***-***-****").replace(CREDIT_CARD_REGEX, "****-****-****-****").replace(ADDRESS_REGEX, "*** *** ***").replace(IP_REGEX, "***.***.***.***");
}, "defaultMaskText");

// src/sessions/provider.ts
var MAX_BUFFER_SIZE = 100;
var MAX_CHUNK_BYTES = 1 * 1024 * 1024;
var MAX_TIME_BETWEEN_CHUNKS = 1e3 * 30;
var BasicSessionProvider = class {
  static {
    __name(this, "BasicSessionProvider");
  }
  eventBuffer;
  activeSession;
  exporter;
  constructor(sessionOptions) {
    this.exporter = sessionOptions.exporter;
    const sessionId = sessionOptions.sessionId ?? this.generateSessionId();
    this.activeSession = { id: sessionId };
    this.eventBuffer = {
      count: 0,
      size: 0,
      events: [],
      startTime: (/* @__PURE__ */ new Date()).getTime()
    };
  }
  getActiveSession() {
    return this.activeSession;
  }
  flushBuffer() {
    if (this.eventBuffer.count === 0) {
      return;
    }
    const chunk = {
      sessionId: this.activeSession.id,
      events: [...this.eventBuffer.events]
    };
    this.exporter.addToQueue(chunk);
    this.eventBuffer.count = 0;
    this.eventBuffer.size = 0;
    this.eventBuffer.events = [];
    this.eventBuffer.startTime = (/* @__PURE__ */ new Date()).getTime();
  }
  async startRecording() {
    try {
      const { record } = await import("rrweb");
      record({
        emit: this.handleEvent.bind(this),
        blockClass: "iudex-block",
        ignoreClass: "iudex-ignore",
        maskAllInputs: true,
        maskTextSelector: "*",
        // Mask all text
        maskTextFn: defaultMaskText,
        maskInputFn: defaultMaskText
      });
      window?.addEventListener("beforeunload", this._onBeforeUnload);
    } catch (error) {
      console.info("Failed to initialize recording:", error);
    }
  }
  handleEvent(event) {
    this.eventBuffer.events.push(event);
    this.eventBuffer.count += 1;
    this.eventBuffer.size += JSON.stringify(event).length;
    if (this.shouldFlushBuffer()) {
      this.flushBuffer();
    }
  }
  shouldFlushBuffer() {
    return this.eventBuffer.count > MAX_BUFFER_SIZE || this.eventBuffer.size > MAX_CHUNK_BYTES || (/* @__PURE__ */ new Date()).getTime() - this.eventBuffer.startTime > MAX_TIME_BETWEEN_CHUNKS;
  }
  generateSessionId() {
    return `ses_${safeCuid_default()}`;
  }
  _onBeforeUnload = /* @__PURE__ */ __name(() => {
    this.flushBuffer();
    this.exporter.shutdown();
  }, "_onBeforeUnload");
};

// src/sessions/exporter.ts
var SessionExporter = class {
  static {
    __name(this, "SessionExporter");
  }
  url;
  headers = {};
  queue = [];
  isUploading = false;
  interval;
  timeoutId = null;
  constructor({
    url,
    headers,
    interval
  }) {
    this.url = url;
    this.headers = headers;
    this.interval = interval;
  }
  addToQueue(chunk) {
    this.queue.push(chunk);
    this.scheduleUpload();
  }
  scheduleUpload() {
    if (!this.isUploading && !this.timeoutId) {
      this.timeoutId = setTimeout(() => this.startUploading(), this.interval);
    }
  }
  async startUploading() {
    if (this.isUploading || this.queue.length === 0) {
      this.timeoutId = null;
      return;
    }
    this.isUploading = true;
    const chunk = this.queue[0];
    this.queue.shift();
    try {
      await this.uploadChunk(chunk);
    } catch (error) {
      console.info("Failed to upload chunk:", error);
      this.queue.unshift(chunk);
    } finally {
      this.isUploading = false;
      this.timeoutId = null;
      this.scheduleUpload();
    }
  }
  async uploadChunk(chunk) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers
      },
      body: JSON.stringify(chunk)
    });
    if (!response.ok) {
      throw new Error(`Failed to upload chunk: ${response.statusText}`);
    }
  }
  shutdown() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.queue.length > 0) {
      const promises = this.queue.map((chunk) => this.uploadChunk(chunk));
      Promise.allSettled(promises).then((results) => {
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(`Uploaded ${results.length - failed} chunks, ${failed} failed`);
      }).catch((error) => {
        console.warn("Failed to upload remaining chunks:", error);
      });
    }
  }
};

// src/instrument.ts
function defaultInstrumentConfig() {
  if (typeof process === "undefined") {
    global.process = { env: {} };
  }
  if (typeof process.env === "undefined") {
    global.process.env = {};
  }
  return {
    baseUrl: process.env.IUDEX_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "https://api.iudex.ai",
    iudexApiKey: process.env.IUDEX_API_KEY,
    publicWriteOnlyIudexApiKey: process.env.PUBLIC_WRITE_ONLY_IUDEX_API_KEY || process.env.NEXT_PUBLIC_WRITE_ONLY_IUDEX_API_KEY,
    serviceName: process.env.OTEL_SERVICE_NAME || "unknown-service",
    gitCommit: process.env.GIT_COMMIT,
    githubUrl: process.env.GITHUB_URL,
    env: process.env.NODE_ENV,
    headers: {},
    withCredentials: false,
    settings: {},
    otelConfig: {}
  };
}
__name(defaultInstrumentConfig, "defaultInstrumentConfig");
function instrument(instrumentConfig = {}) {
  if (config.isInstrumented) return;
  if (!globalThis.XMLHttpRequest) globalThis.XMLHttpRequest = XMLHttpRequest2;
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
    redact
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };
  if (!publicWriteOnlyIudexApiKey && !iudexApiKey) {
    console.warn(
      `The PUBLIC_WRITE_ONLY_IUDEX_API_KEY environment variable is missing or empty. Provide PUBLIC_WRITE_ONLY_IUDEX_API_KEY to the environment on load OR instrument with the publicWriteOnlyIudexApiKey option. Example: \`instrument{ publicWriteOnlyIudexApiKey: 'My_API_Key' })\``
    );
    return;
  }
  let url = baseUrl;
  if (url == null || url === "undefined" || url === "null") {
    url = "https://api.iudex.ai";
  }
  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });
  const resource = buildResource({ serviceName, instanceId, gitCommit, githubUrl, env });
  config.resource = resource;
  const propagator = new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator()
    ]
  });
  const loggerProvider = new LoggerProvider2({ resource });
  const logExporter = new OTLPLogExporter({ url: url + "/v1/logs", headers });
  const logRecordProcessor = new SimpleLogRecordProcessor(logExporter);
  if (redact) {
    const reactLogProcessor = new RedactLogProcessor(redact);
    loggerProvider.addLogRecordProcessor(reactLogProcessor);
  }
  if (typeof window !== "undefined") {
    window.loggerProvider = loggerProvider;
  }
  config.loggerProvider = loggerProvider;
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  const traceExporter = new OTLPTraceExporter({ url: url + "/v1/traces", headers });
  const spanProcessor = settings.emitToConsole ? new SimpleSpanProcessor(new ConsoleSpanExporter()) : new BatchSpanProcessor(traceExporter);
  const tracerProvider = new WebTracerProvider({ resource });
  if (typeof window !== "undefined") {
    window.tracerProvider = tracerProvider;
  }
  config.tracerProvider = tracerProvider;
  tracerProvider.addSpanProcessor(spanProcessor);
  tracerProvider.register(
    {
      propagator
    }
  );
  const instrumentations = [];
  if (typeof window !== "undefined" && (settings.instrumentUserInteraction == null || settings.instrumentUserInteraction)) {
    instrumentations.push(new UserInteractionInstrumentation({
      eventNames: [...EVENT_NAMES, ...EVENT_NAMES.map((name) => `react-${name}`)],
      ...otelConfig["@opentelemetry/instrumentation-user-interaction"] || {}
    }));
  }
  if (typeof window !== "undefined" && (settings.instrumentDocumentLoad == null || settings.instrumentDocumentLoad)) {
    instrumentations.push(new DocumentLoadInstrumentation(
      otelConfig["@opentelemetry/instrumentation-document-load"]
    ));
  }
  if (settings.instrumentFetch == null || settings.instrumentFetch) {
    instrumentations.push(new FetchInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      propagateTraceHeaderCorsUrls: /.*/,
      // Propagate to all URL
      ...otelConfig["@opentelemetry/instrumentation-fetch"] || {}
    }));
  }
  if (settings.instrumentXhr == null || settings.instrumentXhr) {
    instrumentations.push(new XMLHttpRequestInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      ...otelConfig["@opentelemetry/instrumentation-xml-http-request"] || {}
    }));
  }
  if (settings.debugMode) {
    console.log("Loaded instrumentations: ", instrumentations);
  }
  registerInstrumentations({ instrumentations });
  if (settings.instrumentConsole || settings.instrumentConsole == void 0) {
    instrumentConsole();
  }
  patchXmlHttpRequestWithCredentials(url, withCredentials);
  if (typeof window !== "undefined") {
    const sessionExporter = new SessionExporter({
      url: url + "/v1/sessions",
      headers,
      interval: 1e3
    });
    const sessionProvider = new BasicSessionProvider({
      exporter: sessionExporter
    });
    window.sessionProvider = sessionProvider;
    config.sessionProvider = sessionProvider;
    const sessionId = sessionProvider.getActiveSession().id;
    const random = Math.abs(
      Math.sin(sessionId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0))
    );
    if (!settings.disableSessionReplay && random < (settings.sessionReplaySampleRate || 1)) {
      void sessionProvider.startRecording();
    }
  }
  config.isInstrumented = true;
}
__name(instrument, "instrument");
function buildHeaders(instrumentConfig) {
  const {
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };
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
  } = { ...defaultInstrumentConfig(), ...instrumentConfig };
  return new Resource2(_2.omitBy({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: instanceId,
    "git.commit": gitCommit,
    "github.url": githubUrl,
    "env": env
  }, _2.isNil));
}
__name(buildResource, "buildResource");
var FETCH_IGNORE_URLS = [
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
  /gstatic.com/
];
var EVENT_NAMES = [
  "click",
  "mousedown",
  "mouseup",
  "keydown",
  "keyup",
  "touchstart",
  "touchend"
];

// src/vercel.ts
import { detectResourcesSync, envDetectorSync, Resource as Resource3 } from "@opentelemetry/resources";
import { OTLPLogExporter as OTLPLogExporter2 } from "@opentelemetry/exporter-logs-otlp-proto";
import { SimpleLogRecordProcessor as SimpleLogRecordProcessor2 } from "@opentelemetry/sdk-logs";
import { OTLPTraceExporter as OTLPTraceExporter2 } from "@opentelemetry/exporter-trace-otlp-http";
import { logs as logs2 } from "@opentelemetry/api-logs";
import _3 from "lodash";
function registerOTelOptions(optionsOrServiceName) {
  if (!globalThis.XMLHttpRequest) globalThis.XMLHttpRequest = XMLHttpRequest2;
  const options = typeof optionsOrServiceName === "string" ? { serviceName: optionsOrServiceName } : optionsOrServiceName || {};
  const {
    baseUrl,
    iudexApiKey,
    publicWriteOnlyIudexApiKey,
    headers: configHeaders
  } = { ...defaultInstrumentConfig(), ...options };
  let url = baseUrl;
  if (url == null || url === "undefined" || url === "null" || url === "") {
    url = "https://api.iudex.ai";
  }
  const headers = buildHeaders({ iudexApiKey, publicWriteOnlyIudexApiKey, headers: configHeaders });
  const logExporter = new OTLPLogExporter2({ url: url + "/v1/logs", headers });
  const logRecordProcessor = new SimpleLogRecordProcessor2(logExporter);
  const traceExporter = new OTLPTraceExporter2({ url: url + "/v1/traces", headers });
  let resource = buildResource(options);
  resource = buildVercelResource();
  const resourceDetectors = [envDetectorSync];
  const internalConfig = { detectors: resourceDetectors };
  resource = resource.merge(detectResourcesSync(internalConfig));
  const loggerProvider = new LoggerProvider2({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  logs2.setGlobalLoggerProvider(loggerProvider);
  options.traceExporter = traceExporter;
  options.attributes = resource.attributes;
  const settings = options.settings || {};
  if (settings.instrumentConsole || settings.instrumentConsole == null) {
    instrumentConsole();
  }
  config.isInstrumented = true;
  return options;
}
__name(registerOTelOptions, "registerOTelOptions");
function buildVercelResource() {
  const resource = new Resource3(
    _3.omitBy({
      // Node.
      "node.ci": process.env.CI ? true : void 0,
      "node.env": process.env.NODE_ENV,
      // Vercel.
      // https://vercel.com/docs/projects/environment-variables/system-environment-variables
      // Vercel Env set as top level attribute for simplicity.
      // One of 'production', 'preview' or 'development'.
      "env": process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV,
      "vercel.region": process.env.VERCEL_REGION,
      "vercel.runtime": process.env.NEXT_RUNTIME || "nodejs",
      "vercel.sha": process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      "vercel.host": process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || void 0,
      "vercel.branch_host": process.env.VERCEL_BRANCH_URL || process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL || void 0
    }, _3.isNil)
  );
  return resource;
}
__name(buildVercelResource, "buildVercelResource");

// src/cloudflare-worker.ts
var cloudflare_worker_exports = {};
__export(cloudflare_worker_exports, {
  trace: () => trace4,
  withTracing: () => withTracing2,
  workersConfigSettings: () => workersConfigSettings
});
import _4 from "lodash";
var workersConfigSettings = {
  instrumentUserInteraction: false,
  instrumentDocumentLoad: false,
  instrumentXhr: false
};
function withTracing2(fn, ctx = {}, config2 = {}) {
  if (!globalThis.XMLHttpRequest) globalThis.XMLHttpRequest = XMLHttpRequest2;
  if (!ctx.beforeRun) ctx.beforeRun = (arg1, env, ctx2) => {
    config.workerEvent = ctx2;
    if (config2.settings == null)
      config2.settings = workersConfigSettings;
    if (config2.settings.instrumentUserInteraction == null)
      config2.settings.instrumentUserInteraction = false;
    if (config2.settings.instrumentDocumentLoad == null)
      config2.settings.instrumentDocumentLoad = false;
    if (config2.settings.instrumentXhr == null)
      config2.settings.instrumentXhr = false;
    if (config2.iudexApiKey == null)
      config2.iudexApiKey = env["IUDEX_API_KEY"] || env["PUBLIC_WRITE_ONLY_IUDEX_API_KEY"];
    instrument(config2);
  };
  return withTracing(fn, ctx);
}
__name(withTracing2, "withTracing");
function trace4(exportedHandler, ctx, config2 = {}) {
  return _4.mapValues(exportedHandler, (handler, key) => {
    if (!handler) return;
    return withTracing2(
      handler,
      { ...ctx, name: `${ctx.name}.${key}` },
      config2
    );
  });
}
__name(trace4, "trace");

// src/index.ts
function trackAttribute(key, value) {
  const activeSpan = trace5.getActiveSpan();
  activeSpan?.setAttribute(key, value);
}
__name(trackAttribute, "trackAttribute");
var setAttribute = trackAttribute;
function setStatus(code) {
  const activeSpan = trace5.getActiveSpan();
  activeSpan?.setStatus({ code });
}
__name(setStatus, "setStatus");
function setError(error) {
  const activeSpan = trace5.getActiveSpan();
  activeSpan?.setStatus({ code: SpanStatusCode3.ERROR, message: error.message });
  activeSpan?.recordException(error);
}
__name(setError, "setError");
function setName(name) {
  const activeSpan = trace5.getActiveSpan();
  activeSpan?.updateName(name);
}
__name(setName, "setName");
function trackGlobalAttribute(key, value) {
  const { loggerProvider, tracerProvider } = config;
  const loggerAttrs = loggerProvider?._sharedState.resource?._attributes;
  if (loggerAttrs) {
    loggerAttrs[key] = value;
  }
  const tracerAttrs = tracerProvider?.resource?._attributes;
  if (tracerAttrs) {
    tracerAttrs[key] = value;
  }
}
__name(trackGlobalAttribute, "trackGlobalAttribute");
export {
  Dispatch,
  EVENT_NAMES,
  FETCH_IGNORE_URLS,
  XMLHttpRequest2 as XMLHttpRequest,
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
  cloudflare_worker_exports as iudexCloudflare,
  console_instrumentation_exports as iudexConsole,
  nativeConsole,
  registerOTelOptions,
  setAttribute,
  setError,
  setName,
  setStatus,
  trackAttribute,
  trackGlobalAttribute,
  useTracing,
  withTracing
};
