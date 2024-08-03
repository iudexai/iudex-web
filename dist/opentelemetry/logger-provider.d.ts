import { Context } from '@opentelemetry/api';
import { LoggerOptions } from '@opentelemetry/api-logs';
import type * as logsAPI from '@opentelemetry/api-logs';
import { LogRecord, LogRecordProcessor, LoggerProviderConfig } from '@opentelemetry/sdk-logs';
import { InstrumentationScope } from '@opentelemetry/core';
import { LoggerProviderSharedState } from '@opentelemetry/sdk-logs/build/src/internal/LoggerProviderSharedState.js';
import { LogRecordLimits } from '@opentelemetry/sdk-logs';
export declare const DEFAULT_LOGGER_NAME = "unknown";
export declare class LoggerProvider implements logsAPI.LoggerProvider {
    private _shutdownOnce;
    private readonly _sharedState;
    constructor(config?: LoggerProviderConfig);
    /**
     * Get a logger with the configuration of the LoggerProvider.
     */
    getLogger(name: string, version?: string, options?: LoggerOptions): Logger;
    /**
     * Adds a new {@link LogRecordProcessor} to this logger.
     * @param processor the new LogRecordProcessor to be added.
     */
    addLogRecordProcessor(processor: LogRecordProcessor): void;
    /**
     * Notifies all registered LogRecordProcessor to flush any buffered data.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    forceFlush(): Promise<void>;
    /**
     * Flush all buffered data and shut down the LoggerProvider and all registered
     * LogRecordProcessor.
     *
     * Returns a promise which is resolved when all flushes are complete.
     */
    shutdown(): Promise<void>;
    private _shutdown;
}
export declare class MultiLogRecordProcessor implements LogRecordProcessor {
    readonly processors: LogRecordProcessor[];
    readonly forceFlushTimeoutMillis: number;
    constructor(processors: LogRecordProcessor[], forceFlushTimeoutMillis: number);
    forceFlush(): Promise<void>;
    onEmit(logRecord: LogRecord, context?: Context): void;
    shutdown(): Promise<void>;
}
export declare function loadDefaultConfig(): {
    forceFlushTimeoutMillis: number;
    logRecordLimits: {
        attributeValueLengthLimit: number;
        attributeCountLimit: number;
    };
    includeTraceContext: boolean;
};
export declare function reconfigureLimits(logRecordLimits: LogRecordLimits): Required<LogRecordLimits>;
export declare class Logger implements logsAPI.Logger {
    readonly instrumentationScope: InstrumentationScope;
    private _sharedState;
    constructor(instrumentationScope: InstrumentationScope, _sharedState: LoggerProviderSharedState);
    emit(logRecord: logsAPI.LogRecord): void;
}
