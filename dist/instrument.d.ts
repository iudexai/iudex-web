export type InstrumentConfig = {
    baseUrl?: string;
    iudexApiKey?: string;
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
export declare function instrument({ baseUrl, iudexApiKey, serviceName, instanceId, gitCommit, githubUrl, env, headers: configHeaders, settings, }?: InstrumentConfig): void;
