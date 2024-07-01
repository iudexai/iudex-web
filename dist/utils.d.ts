export declare const config: {
    isInstrumented: boolean;
    nativeConsole: typeof console;
    nativeFetch: typeof fetch;
    workerEvent?: {
        waitUntil(f: Promise<any>): void;
    };
};
export declare const nativeConsole: Console;
export declare function convertSeverityTextToNumber(severityText: string | undefined): 1 | 5 | 9 | 13 | 17 | 21 | undefined;
export declare function convertSeverityValuesToLevel(severityNumber: number | undefined, severityText?: string | undefined): string;
export declare function getCallerInfo(frameDepth: number): {
    filePath?: string;
    lineNum?: number;
    caller?: string;
};
/**
 * Flattens nested object keys into dot-separated strings.
 * e.g. {a.b.c: 1, a.d: 2, e: 3}
 */
export declare function flattenObject(obj?: Record<string, any>, parentKey?: string, result?: Record<string, any>): Record<string, any> | undefined;
export declare function emitOtelLog({ level, body, severityNumber, attributes, stackDepth, }: {
    level: string;
    body: any;
    severityNumber?: number;
    attributes?: Record<string, any>;
    stackDepth?: number;
}): void;
export declare class Dispatch extends EventTarget {
    dispatch(eventName: string): void;
}
export declare class XMLHttpRequest extends Dispatch {
    UNSENT: number;
    OPENED: number;
    HEADERS_RECEIVED: number;
    LOADING: number;
    DONE: number;
    upload: Dispatch;
    url?: string;
    method?: string;
    headers?: Headers;
    readyState?: number;
    _controller?: AbortController;
    withCredentials: boolean;
    errored: boolean;
    responseHeaders: Response['headers'] | undefined;
    responseURL?: string;
    responseValue?: any;
    responseType?: XMLHttpRequestResponseType;
    status?: number;
    statusText?: string;
    constructor();
    open(method: string, url: string): void;
    setRequestHeader(key: string, value: string): void;
    abort(): void;
    send(payload?: any): void;
    get responseText(): any;
    getAllResponseHeaders(): string;
    getResponseHeader(headerName: string): string | null;
}
