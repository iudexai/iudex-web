import { Resource } from '@opentelemetry/resources';
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
    settings?: Partial<{
        instrumentConsole: boolean;
        instrumentWindow: boolean;
        instrumentXhr: boolean;
    }>;
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
};
export declare function instrument(instrumentConfig?: InstrumentConfig): void;
export declare function buildHeaders(instrumentConfig: Pick<InstrumentConfig, 'iudexApiKey' | 'publicWriteOnlyIudexApiKey' | 'headers'>): Record<string, string>;
export declare function buildResource(instrumentConfig: Pick<InstrumentConfig, 'serviceName' | 'instanceId' | 'gitCommit' | 'githubUrl' | 'env'>): Resource;
export declare function lazyObj<T extends object>(instantiator: () => T): T;
