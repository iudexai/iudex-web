import {
  SEMATTRS_CODE_FILEPATH,
  SEMATTRS_CODE_FUNCTION,
  SEMATTRS_CODE_LINENO,
} from '@opentelemetry/semantic-conventions';
import { LoggerProvider, logs } from '@opentelemetry/api-logs';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

import _ from 'lodash';
import { Resource } from '@opentelemetry/resources';

export const config: {
  isInstrumented: boolean;
  nativeConsole: typeof console;
  nativeFetch: typeof fetch;
  workerEvent?: { waitUntil (f: Promise<any>): void };
  loggerProvider?: LoggerProvider;
  tracerProvider?: BasicTracerProvider;
  resource?: Resource;
} = {
  isInstrumented: false,
  nativeConsole: { ...console },
  nativeFetch: fetch.bind(globalThis),
};

// Native console
export const nativeConsole = config.nativeConsole;

export function convertSeverityTextToNumber(severityText: string | undefined) {
  if (severityText == undefined) {
    // should be UNSPECIFIED=0 but we pass through undefined for convenience
    return;
  }
  switch (severityText) {
    case 'TRACE':
      return 1;
    case 'DEBUG':
      return 5;
    case 'INFO':
      return 9;
    case 'WARN':
      return 13;
    case 'ERROR':
      return 17;
    case 'FATAL':
      return 21;
    default:
      // should be UNRECOGNIZED=-1 but we pass through undefined for convenience
      return;
  }
}

export function convertSeverityValuesToLevel(
  severityNumber: number | undefined,
  severityText?: string | undefined,
): string {
  // Default to out of scope number.
  severityNumber ||= convertSeverityTextToNumber(severityText) || 0;

  if (severityNumber >= 1 && severityNumber <= 4) {
    return 'TRACE';
  } else if (severityNumber >= 5 && severityNumber <= 8) {
    return 'DEBUG';
  } else if (severityNumber >= 9 && severityNumber <= 12) {
    return 'INFO';
  } else if (severityNumber >= 13 && severityNumber <= 16) {
    return 'WARN';
  } else if (severityNumber >= 17 && severityNumber <= 20) {
    return 'ERROR';
  } else if (severityNumber >= 21 && severityNumber <= 24) {
    return 'FATAL';
  } else {
    return 'INFO';
  }
}

export function getCallerInfo(frameDepth: number): {
  filePath?: string;
  lineNum?: number;
  caller?: string;
} {
  const stack = new Error().stack;
  if (!stack) return {};

  /*
  Structure looks like:
    Error
      at /iudex-node-module/test/express_instrumentation.test.ts:49:10
      at Layer.handle [as handle_request] (/Users/arnogau/.pnpm/express@4.19.2/layer.js:95:5)
      at Pino.write (/modules/.pnpm/pino@9.1.0/node_modules/pino/lib/proto.js:204:35)
  */
  const stackLines = stack.split('\n');
  const callerStackLine = stackLines[frameDepth + 1];

  const callerAndPathRegex =
    /at (?<caller>.+?) \((?<filePath>[^:()]+(?::[^:()]+)*):(?<lineNum>\d+):\d+\)/;
  const capMatch = callerStackLine.match(callerAndPathRegex);
  if (capMatch) {
    const { filePath, lineNum, caller } = capMatch.groups as Record<string, string>;
    return { filePath, lineNum: Number(lineNum), caller };
  }

  const pathOnlyRegex =
    /at (?<filePath>[^:()]+(?::[^:()]+)*):(?<lineNum>\d+):\d+/;
  const poMatch = callerStackLine.match(pathOnlyRegex);
  if (poMatch) {
    const { filePath, lineNum } = poMatch.groups as Record<string, string>;
    return { filePath, lineNum: Number(lineNum) };
  }

  return {};
}

/**
 * Flattens nested object keys into dot-separated strings.
 * e.g. {a.b.c: 1, a.d: 2, e: 3}
 */
export function flattenObject(
  obj?: Record<string, any>,
  parentKey = '',
  result: Record<string, any> = {},
) {
  if (!obj) return;
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(obj[key])) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

/*
REGEX test cases
at getCallerInfo (/Users/username/.../instrumentation.ts:96:15)
at Object.<anonymous> (/Users/username/instrumentation.ts:21:1)
at /iudex-node-module/test/express_instrumentation.test.ts:49:10
at Layer.handle [as handle_request] (/Users/arnogau/.pnpm/express@4.19.2/layer.js:95:5)
at Layer.handle (/Users/arnogau/.pnpm/express@4.19.2/layer.js:95:5)
at <anonymous>:1:43
at f (<anonymous>:1:29)
at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
*/

export function emitOtelLog({
  level,
  body,
  severityNumber,
  attributes,
  stackDepth,
}: {
  level: string;
  body: any;
  severityNumber?: number;
  attributes?: Record<string, any>;
  stackDepth?: number,
}) {
  if (!config.isInstrumented) return;

  const attrs = { ...attributes };

  if (stackDepth != null) {
    const { filePath, lineNum, caller } = getCallerInfo(stackDepth + 1);
    Object.assign(attrs, {
      [SEMATTRS_CODE_FILEPATH]: filePath,
      [SEMATTRS_CODE_LINENO]: lineNum,
      [SEMATTRS_CODE_FUNCTION]: caller,
    });
  }

  // TODO: cache named logger
  const otelLogger = config.loggerProvider?.getLogger('default') || logs.getLogger('default');
  otelLogger.emit({
    severityNumber: severityNumber || convertSeverityTextToNumber(level.toUpperCase()),
    severityText: level.toUpperCase(),
    body,
    attributes: _.omitBy(attrs, _.isNil),
  });
}

export class Dispatch extends EventTarget {
  dispatch(eventName: string) {
    const ev = new Event(eventName);
    if (('on' + eventName) in this) {
      (this as any)['on' + eventName](ev);
    }
    this.dispatchEvent(ev);
  }
}

export class XMLHttpRequest extends Dispatch {
  // readyState enumeration
  UNSENT = 0;
  OPENED = 1;
  HEADERS_RECEIVED = 2;
  LOADING = 3;
  DONE = 4;

  upload: Dispatch = new Dispatch();

  // Request
  url?: string;
  method?: string;
  headers?: Headers;
  readyState?: number;
  _controller?: AbortController;
  withCredentials: boolean = false;

  // Response
  errored = false;
  responseHeaders: Response['headers'] | undefined = undefined;
  responseURL?: string;
  responseValue?: any;
  responseType?: XMLHttpRequestResponseType;
  status?: number;
  statusText?: string;

  constructor() {
    super();
  }

  open(method: string, url: string) {
    this.url = url;
    this.method = method;
    this.headers = new Headers();
    this.readyState = this.UNSENT;
    this.responseType = '';
    this._controller = new AbortController();
  }

  setRequestHeader(key: string, value: string) {
    this.headers?.set(key, value);
  }

  abort() {
    this.upload.dispatch('abort');
    this._controller?.abort();
  }

  send(payload?: any) {
    this.readyState = this.OPENED;
    this.status = 0;
    this.dispatch('readystatechange');
    this.upload.dispatch('loadstart');
    if (!this.url) {
      throw new DOMException(
        `Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED`,
      );
    }

    const fetchPromise = config.nativeFetch(this.url, {
      method: this.method,
      credentials: 'credentials' in Request.prototype
        ? (this.withCredentials ? 'omit' : 'include')
        : undefined,
      headers: this.headers,
      signal: this._controller?.signal,
      body: payload,
    }).then(response => {
      this.responseHeaders = response.headers;
      this.readyState = this.HEADERS_RECEIVED;
      this.responseURL = response.url;
      this.status = response.status;
      this.statusText = response.statusText;

      this.responseType = 'text';
      const contentType = response.headers.get('content-type');
      if (!contentType) {
        // Do nothing
      } else if (contentType.includes('application/json')) {
        this.responseType = 'json';
      } else if (contentType.includes('text/html')) {
        this.responseType = 'document';
      } else if (contentType.includes('application/octet-stream')) {
        this.responseType = 'blob';
      }

      switch (this.responseType) {
        case undefined: return response.text();
        // case 'arraybuffer': return response.arrayBuffer();
        case 'blob': return response.blob();
        case 'document': return response.text();
        case 'json': return response.json();
      }
      return response.text();
    }).then(value => {
      this.responseValue = value;
      this.readyState = this.DONE;
      this.dispatch('readystatechange');
      this.upload.dispatch('progress');
      this.dispatch('progress');
      this.upload.dispatch('load');
      this.dispatch('load');
    }).catch(err => {
      this.errored = true;
      this.dispatch('error');
      this.upload.dispatch('error');
      this.readyState = this.DONE;
      this.dispatch('readystatechange');
    }).finally(() => {
      this.upload.dispatch('loadend');
      this.dispatch('loadend');
    });

    config.workerEvent?.waitUntil(fetchPromise);
  }

  get responseText() {
    if (this.responseValue) {
      if (this.responseType === 'arraybuffer') {
        return new TextDecoder().decode(this.responseValue);
      }
      if (this.responseType === 'json') {
        return JSON.stringify(this.responseValue);
      }
      if (this.responseValue === 'blob') {
        return new TextDecoder().decode(this.responseValue);
      }
      return this.responseValue;
    }

    // No content returns empty string
    return '';
  }

  getAllResponseHeaders() {
    if (this.errored
      || (this.readyState && this.readyState < this.HEADERS_RECEIVED)
      || !this.responseHeaders
    ) return '';
    return Object.entries(this.responseHeaders)
      .map(([header, value]) => `${header}: ${value}`).join('\r\n');
  }

  getResponseHeader(headerName: string) {
    return this.responseHeaders?.get(headerName.toLowerCase()) || null;
  }
}
