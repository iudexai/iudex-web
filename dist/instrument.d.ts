import { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-web';
import { Resource } from '@opentelemetry/resources';
import { LogRecord } from '@opentelemetry/sdk-logs';
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
        instrumentConsole?: boolean;
        instrumentXhr?: boolean;
        instrumentFetch?: boolean;
        instrumentUserInteraction?: boolean;
        instrumentDocumentLoad?: boolean;
        emitToConsole?: boolean;
        debugMode?: boolean;
        disableSessionReplay?: boolean;
        sessionReplaySampleRate?: number;
    };
    otelConfig?: InstrumentationConfigMap;
    redact?: RegExp | string | ((logRecord: LogRecord) => void);
};
export declare function defaultInstrumentConfig(): {
    baseUrl: string;
    iudexApiKey: string | undefined;
    publicWriteOnlyIudexApiKey: string | undefined;
    serviceName: string;
    gitCommit: string | undefined;
    githubUrl: string | undefined;
    env: string | undefined;
    headers: {};
    withCredentials: false;
    settings: {};
    otelConfig: {};
};
export declare function instrument(instrumentConfig?: InstrumentConfig): void;
export declare function buildHeaders(instrumentConfig: Pick<InstrumentConfig, 'iudexApiKey' | 'publicWriteOnlyIudexApiKey' | 'headers'>): Record<string, string>;
export declare function buildResource(instrumentConfig: Pick<InstrumentConfig, 'serviceName' | 'instanceId' | 'gitCommit' | 'githubUrl' | 'env'>): Resource;
export declare const FETCH_IGNORE_URLS: RegExp[];
export declare const EVENT_NAMES: string[];
