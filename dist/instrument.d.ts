import { Resource } from '@opentelemetry/resources';
import { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-web';
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
        instrumentConsole?: boolean;
        instrumentWindow?: boolean;
        instrumentXhr?: boolean;
        instrumentFetch?: boolean;
        emitToConsole?: boolean;
    };
    otelConfig?: InstrumentationConfigMap;
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
    settings: {};
    otelConfig: {};
};
export declare function instrument(instrumentConfig?: InstrumentConfig): void;
export declare function buildHeaders(instrumentConfig: Pick<InstrumentConfig, 'iudexApiKey' | 'publicWriteOnlyIudexApiKey' | 'headers'>): Record<string, string>;
export declare function buildResource(instrumentConfig: Pick<InstrumentConfig, 'serviceName' | 'instanceId' | 'gitCommit' | 'githubUrl' | 'env'>): Resource;
