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
  EVENT_NAMES: () => EVENT_NAMES,
  FETCH_IGNORE_URLS: () => FETCH_IGNORE_URLS,
  XMLHttpRequest: () => XMLHttpRequest2,
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
  iudexConsole: () => console_instrumentation_exports,
  nativeConsole: () => nativeConsole,
  registerOTelOptions: () => registerOTelOptions,
  setAttribute: () => setAttribute,
  setError: () => setError,
  setName: () => setName,
  setStatus: () => setStatus,
  trackAttribute: () => trackAttribute,
  trackGlobalAttribute: () => trackGlobalAttribute,
  useTracing: () => useTracing,
  withTracing: () => withTracing
});
module.exports = __toCommonJS(src_exports);
var import_api3 = require("@opentelemetry/api");

// src/utils.ts
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var import_api_logs = require("@opentelemetry/api-logs");
var import_lodash = __toESM(require("lodash"));
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
      [import_semantic_conventions.SEMATTRS_CODE_FILEPATH]: filePath,
      [import_semantic_conventions.SEMATTRS_CODE_LINENO]: lineNum,
      [import_semantic_conventions.SEMATTRS_CODE_FUNCTION]: caller
    });
  }
  if (config.sessionProvider) {
    attrs.session = config.sessionProvider.getActiveSession();
  }
  const otelLogger = config.loggerProvider?.getLogger("default") || import_api_logs.logs.getLogger("default");
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
var import_api = require("@opentelemetry/api");
function withTracing(fn, ctx = {}) {
  return function(...args) {
    const { name, trackArgs = true, maxArgKeys, maxArgDepth, attributes, setSpan, setArgs } = ctx;
    const tracer = import_api.trace.getTracer("default");
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
            const flatObj = flattenObject(args[0], "", {}, /* @__PURE__ */ new Set(), maxArgKeys, maxArgDepth);
            flatObj && Object.entries(flatObj).forEach(([key, value]) => {
              span.setAttribute(key, value);
            });
          } else if (args.length > 1) {
            const flatObjs = flattenObject(args, "", {}, /* @__PURE__ */ new Set(), maxArgKeys, maxArgDepth);
            flatObjs && Object.entries(flatObjs).forEach(([key, value]) => {
              span.setAttribute(key, value);
            });
          }
        }
        if (setArgs) {
          setArgs(span, args);
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
            return res;
          }).catch((err) => {
            span.setStatus({ code: import_api.SpanStatusCode.ERROR, message: String(err) });
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
var import_exporter_logs_otlp_proto = require("@opentelemetry/exporter-logs-otlp-proto");
var import_exporter_trace_otlp_http = require("@opentelemetry/exporter-trace-otlp-http");
var import_instrumentation2 = require("@opentelemetry/instrumentation");
var import_instrumentation_document_load = require("@opentelemetry/instrumentation-document-load");
var import_instrumentation_fetch = require("@opentelemetry/instrumentation-fetch");
var import_instrumentation_xml_http_request = require("@opentelemetry/instrumentation-xml-http-request");
var import_resources2 = require("@opentelemetry/resources");
var import_sdk_logs2 = require("@opentelemetry/sdk-logs");
var import_sdk_trace_base = require("@opentelemetry/sdk-trace-base");
var import_sdk_trace_web2 = require("@opentelemetry/sdk-trace-web");
var import_semantic_conventions2 = require("@opentelemetry/semantic-conventions");
var import_lodash2 = __toESM(require("lodash"));

// src/instrumentations/console-instrumentation.ts
var console_instrumentation_exports = {};
__export(console_instrumentation_exports, {
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

// src/instrumentations/user-interaction-instrumentation.ts
var import_instrumentation = require("@opentelemetry/instrumentation");
var api = __toESM(require("@opentelemetry/api"));
var import_core = require("@opentelemetry/core");
var import_sdk_trace_web = require("@opentelemetry/sdk-trace-web");
var PACKAGE_NAME = "iudex-web/instrumentation-user-interaction";
var PACKAGE_VERSION = "0.39.0";
var ZONE_CONTEXT_KEY = "OT_ZONE_CONTEXT";
var EVENT_NAVIGATION_NAME = "Navigation:";
var DEFAULT_EVENT_NAMES = ["click"];
function defaultShouldPreventSpanCreation() {
  return false;
}
__name(defaultShouldPreventSpanCreation, "defaultShouldPreventSpanCreation");
var UserInteractionInstrumentation = class extends import_instrumentation.InstrumentationBase {
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
        spanData.hrTimeLastTimeout = (0, import_core.hrTime)();
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
    const xpath = (0, import_sdk_trace_web.getElementXPath)(element, true);
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
        parentSpan ? api.trace.setSpan(api.context.active(), parentSpan) : void 0
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
    const context3 = zone.get(ZONE_CONTEXT_KEY);
    if (context3) {
      return api.trace.getSpan(context3);
    }
    return context3;
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
              return api.context.with(
                api.trace.setSpan(api.context.active(), span),
                () => {
                  const result = plugin._invokeListener(listener, this, args);
                  return result;
                }
              );
            } catch (e) {
              const error = e;
              span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
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
    if ((0, import_instrumentation.isWrapped)(history.replaceState)) this._unwrap(history, "replaceState");
    if ((0, import_instrumentation.isWrapped)(history.pushState)) this._unwrap(history, "pushState");
    if ((0, import_instrumentation.isWrapped)(history.back)) this._unwrap(history, "back");
    if ((0, import_instrumentation.isWrapped)(history.forward)) this._unwrap(history, "forward");
    if ((0, import_instrumentation.isWrapped)(history.go)) this._unwrap(history, "go");
  }
  /**
   * Updates interaction span name
   * @param url
   */
  _updateInteractionName(url) {
    const span = api.trace.getSpan(api.context.active());
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
              return api.context.with(
                api.trace.setSpan(api.context.active(), span),
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
              span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
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
                    return api.context.with(
                      api.trace.setSpan(api.context.active(), span2),
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
                    span2.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
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
          span?.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
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
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "runTask");
        this._diag.debug("removing previous patch from method runTask");
      }
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "scheduleTask");
        this._diag.debug("removing previous patch from method scheduleTask");
      }
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.cancelTask)) {
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
        if ((0, import_instrumentation.isWrapped)(target.addEventListener)) {
          this._unwrap(target, "addEventListener");
          this._diag.debug(
            "removing previous patch from method addEventListener"
          );
        }
        if ((0, import_instrumentation.isWrapped)(target.removeEventListener)) {
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
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.runTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "runTask");
      }
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.scheduleTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "scheduleTask");
      }
      if ((0, import_instrumentation.isWrapped)(ZoneWithPrototype.prototype.cancelTask)) {
        this._unwrap(ZoneWithPrototype.prototype, "cancelTask");
      }
    } else {
      const targets = this._getPatchableEventTargets();
      targets.forEach((target) => {
        if ((0, import_instrumentation.isWrapped)(target.addEventListener)) {
          this._unwrap(target, "addEventListener");
        }
        if ((0, import_instrumentation.isWrapped)(target.removeEventListener)) {
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
var import_api2 = require("@opentelemetry/api");
var import_api_logs2 = require("@opentelemetry/api-logs");
var import_sdk_logs = require("@opentelemetry/sdk-logs");
var import_core2 = require("@opentelemetry/core");
var import_LoggerProviderSharedState = require("@opentelemetry/sdk-logs/build/src/internal/LoggerProviderSharedState.js");
var import_resources = require("@opentelemetry/resources");
var DEFAULT_LOGGER_NAME = "unknown";
var LoggerProvider2 = class {
  static {
    __name(this, "LoggerProvider");
  }
  _shutdownOnce;
  _sharedState;
  constructor(config2 = {}) {
    const mergedConfig = merge(loadDefaultConfig(), config2);
    const resource = import_resources.Resource.default().merge(
      mergedConfig.resource ?? import_resources.Resource.empty()
    );
    this._sharedState = new import_LoggerProviderSharedState.LoggerProviderSharedState(
      resource,
      mergedConfig.forceFlushTimeoutMillis,
      reconfigureLimits(mergedConfig.logRecordLimits)
    );
    this._shutdownOnce = new import_core2.BindOnceFuture(this._shutdown, this);
  }
  /**
   * Get a logger with the configuration of the LoggerProvider.
   */
  getLogger(name, version, options) {
    if (this._shutdownOnce.isCalled) {
      import_api2.diag.warn("A shutdown LoggerProvider cannot provide a Logger");
      return import_api_logs2.NOOP_LOGGER;
    }
    if (!name) {
      import_api2.diag.warn("Logger requested without instrumentation scope name.");
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
        (err) => import_api2.diag.error(
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
      import_api2.diag.warn("invalid attempt to force flush after LoggerProvider shutdown");
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
      import_api2.diag.warn("shutdown may only be called once per LoggerProvider");
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
        (processor) => (0, import_core2.callWithTimeout)(processor.forceFlush(), timeout)
      )
    );
  }
  onEmit(logRecord, context3) {
    this.processors.forEach((processors) => processors.onEmit(logRecord, context3));
  }
  async shutdown() {
    await Promise.all(this.processors.map((processor) => processor.shutdown()));
  }
};
function loadDefaultConfig() {
  return {
    forceFlushTimeoutMillis: 3e4,
    logRecordLimits: {
      attributeValueLengthLimit: (0, import_core2.getEnv)().OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: (0, import_core2.getEnv)().OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT
    },
    includeTraceContext: true
  };
}
__name(loadDefaultConfig, "loadDefaultConfig");
function reconfigureLimits(logRecordLimits) {
  const parsedEnvConfig = (0, import_core2.getEnvWithoutDefaults)();
  return {
    attributeCountLimit: logRecordLimits.attributeCountLimit ?? parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT ?? parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT ?? import_core2.DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    attributeValueLengthLimit: logRecordLimits.attributeValueLengthLimit ?? parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT ?? parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT ?? import_core2.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT
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
    const currentContext = logRecord.context || import_api2.context.active();
    const logRecordInstance = new import_sdk_logs.LogRecord(
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
  cuid = require("cuid");
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
var MAX_BUFFER_SIZE = 200;
var MAX_CHUNK_BYTES = 16 * 1024 * 1024;
var BasicSessionProvider = class {
  static {
    __name(this, "BasicSessionProvider");
  }
  eventBuffer;
  activeSession;
  exporter;
  sampleRate;
  constructor(sessionOptions) {
    this.exporter = sessionOptions.exporter;
    this.sampleRate = sessionOptions.sampleRate ?? 1;
    const sessionId = sessionOptions.sessionId ?? this.generateSessionId();
    this.activeSession = { id: sessionId };
    this.eventBuffer = {
      count: 0,
      size: 0,
      events: []
    };
    void this.initializeRecording();
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
  }
  async initializeRecording() {
    const sessionId = this.activeSession.id;
    const random = Math.abs(
      Math.sin(sessionId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0))
    );
    const shouldSample = random < this.sampleRate;
    if (!shouldSample) {
      return;
    }
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
      console.error("Failed to initialize recording:", error);
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
    return this.eventBuffer.count > MAX_BUFFER_SIZE || this.eventBuffer.size > MAX_CHUNK_BYTES;
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
      console.error("Failed to upload chunk:", error);
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
        console.error("Failed to upload remaining chunks:", error);
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
  const loggerProvider = new LoggerProvider2({ resource });
  const logExporter = new import_exporter_logs_otlp_proto.OTLPLogExporter({ url: url + "/v1/logs", headers });
  const logRecordProcessor = new import_sdk_logs2.SimpleLogRecordProcessor(logExporter);
  if (redact) {
    const reactLogProcessor = new RedactLogProcessor(redact);
    loggerProvider.addLogRecordProcessor(reactLogProcessor);
  }
  if (typeof window !== "undefined") {
    window.loggerProvider = loggerProvider;
  }
  config.loggerProvider = loggerProvider;
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  const traceExporter = new import_exporter_trace_otlp_http.OTLPTraceExporter({ url: url + "/v1/traces", headers });
  const spanProcessor = settings.emitToConsole ? new import_sdk_trace_base.SimpleSpanProcessor(new import_sdk_trace_base.ConsoleSpanExporter()) : new import_sdk_trace_base.BatchSpanProcessor(traceExporter);
  const tracerProvider = new import_sdk_trace_web2.WebTracerProvider({ resource });
  if (typeof window !== "undefined") {
    window.tracerProvider = tracerProvider;
  }
  config.tracerProvider = tracerProvider;
  tracerProvider.addSpanProcessor(spanProcessor);
  tracerProvider.register();
  const instrumentations = [];
  if (typeof window !== "undefined" && (settings.instrumentUserInteraction == null || settings.instrumentUserInteraction)) {
    instrumentations.push(new UserInteractionInstrumentation({
      eventNames: [...EVENT_NAMES, ...EVENT_NAMES.map((name) => `react-${name}`)],
      ...otelConfig["@opentelemetry/instrumentation-user-interaction"] || {}
    }));
  }
  if (typeof window !== "undefined" && (settings.instrumentDocumentLoad == null || settings.instrumentDocumentLoad)) {
    instrumentations.push(new import_instrumentation_document_load.DocumentLoadInstrumentation(
      otelConfig["@opentelemetry/instrumentation-document-load"]
    ));
  }
  if (settings.instrumentFetch == null || settings.instrumentFetch) {
    instrumentations.push(new import_instrumentation_fetch.FetchInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      ...otelConfig["@opentelemetry/instrumentation-fetch"] || {}
    }));
  }
  if (settings.instrumentXhr == null || settings.instrumentXhr) {
    instrumentations.push(new import_instrumentation_xml_http_request.XMLHttpRequestInstrumentation({
      ignoreUrls: FETCH_IGNORE_URLS,
      ...otelConfig["@opentelemetry/instrumentation-xml-http-request"] || {}
    }));
  }
  if (settings.debugMode) {
    console.log("Loaded instrumentations: ", instrumentations);
  }
  (0, import_instrumentation2.registerInstrumentations)({ instrumentations });
  if (settings.instrumentConsole || settings.instrumentConsole == void 0) {
    instrumentConsole();
  }
  patchXmlHttpRequestWithCredentials(url, withCredentials);
  if (typeof window !== "undefined" && !settings.disableSessionReplay) {
    const sessionExporter = new SessionExporter({
      url: url + "/v1/sessions",
      headers,
      interval: 1e3
    });
    const sessionProvider = new BasicSessionProvider({
      exporter: sessionExporter,
      sampleRate: settings.sessionReplaySampleRate
    });
    window.sessionProvider = sessionProvider;
    config.sessionProvider = sessionProvider;
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
  return new import_resources2.Resource(import_lodash2.default.omitBy({
    [import_semantic_conventions2.SEMRESATTRS_SERVICE_NAME]: serviceName,
    [import_semantic_conventions2.SEMRESATTRS_SERVICE_INSTANCE_ID]: instanceId,
    "git.commit": gitCommit,
    "github.url": githubUrl,
    "env": env
  }, import_lodash2.default.isNil));
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
var import_resources3 = require("@opentelemetry/resources");
var import_exporter_logs_otlp_proto2 = require("@opentelemetry/exporter-logs-otlp-proto");
var import_sdk_logs3 = require("@opentelemetry/sdk-logs");
var import_exporter_trace_otlp_http2 = require("@opentelemetry/exporter-trace-otlp-http");
var import_api_logs3 = require("@opentelemetry/api-logs");
var import_lodash3 = __toESM(require("lodash"));
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
  const logExporter = new import_exporter_logs_otlp_proto2.OTLPLogExporter({ url: url + "/v1/logs", headers });
  const logRecordProcessor = new import_sdk_logs3.SimpleLogRecordProcessor(logExporter);
  const traceExporter = new import_exporter_trace_otlp_http2.OTLPTraceExporter({ url: url + "/v1/traces", headers });
  let resource = buildResource(options);
  resource = buildVercelResource();
  const resourceDetectors = [import_resources3.envDetectorSync];
  const internalConfig = { detectors: resourceDetectors };
  resource = resource.merge((0, import_resources3.detectResourcesSync)(internalConfig));
  const loggerProvider = new LoggerProvider2({ resource });
  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  import_api_logs3.logs.setGlobalLoggerProvider(loggerProvider);
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
  const resource = new import_resources3.Resource(
    import_lodash3.default.omitBy({
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
    }, import_lodash3.default.isNil)
  );
  return resource;
}
__name(buildVercelResource, "buildVercelResource");

// src/cloudflare-worker.ts
var cloudflare_worker_exports = {};
__export(cloudflare_worker_exports, {
  trace: () => trace3,
  withTracing: () => withTracing2,
  workersConfigSettings: () => workersConfigSettings
});
var import_lodash4 = __toESM(require("lodash"));
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
function trace3(exportedHandler, ctx, config2 = {}) {
  return import_lodash4.default.mapValues(exportedHandler, (handler, key) => {
    if (!handler) return;
    return withTracing2(
      handler,
      { ...ctx, name: `${ctx.name}.${key}` },
      config2
    );
  });
}
__name(trace3, "trace");

// src/index.ts
function trackAttribute(key, value) {
  const activeSpan = import_api3.trace.getActiveSpan();
  activeSpan?.setAttribute(key, value);
}
__name(trackAttribute, "trackAttribute");
var setAttribute = trackAttribute;
function setStatus(code) {
  const activeSpan = import_api3.trace.getActiveSpan();
  activeSpan?.setStatus({ code });
}
__name(setStatus, "setStatus");
function setError(error) {
  const activeSpan = import_api3.trace.getActiveSpan();
  activeSpan?.setStatus({ code: import_api3.SpanStatusCode.ERROR, message: error.message });
  activeSpan?.recordException(error);
}
__name(setError, "setError");
function setName(name) {
  const activeSpan = import_api3.trace.getActiveSpan();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Dispatch,
  EVENT_NAMES,
  FETCH_IGNORE_URLS,
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
});
