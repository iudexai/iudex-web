/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { context, Context, diag } from '@opentelemetry/api';
import { LoggerOptions, NOOP_LOGGER } from '@opentelemetry/api-logs';
import type * as logsAPI from '@opentelemetry/api-logs';
import { LogRecord, LogRecordProcessor, LoggerProviderConfig } from '@opentelemetry/sdk-logs';
import { BindOnceFuture, callWithTimeout, DEFAULT_ATTRIBUTE_COUNT_LIMIT,
  DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,getEnv, getEnvWithoutDefaults,
  InstrumentationScope } from '@opentelemetry/core';
import {
  LoggerProviderSharedState,
} from '@opentelemetry/sdk-logs/build/src/internal/LoggerProviderSharedState.js';
import { Resource } from '@opentelemetry/resources';
import { LogRecordLimits } from '@opentelemetry/sdk-logs';


export const DEFAULT_LOGGER_NAME = 'unknown';

export class LoggerProvider implements logsAPI.LoggerProvider {
  private _shutdownOnce: BindOnceFuture<void>;
  private readonly _sharedState: LoggerProviderSharedState;

  constructor(config: LoggerProviderConfig = {}) {
    const mergedConfig: LoggerProviderConfig & ReturnType<typeof loadDefaultConfig>
      = merge(loadDefaultConfig(), config);
    const resource = Resource.default().merge(
      mergedConfig.resource ?? Resource.empty(),
    );
    this._sharedState = new LoggerProviderSharedState(
      resource,
      mergedConfig.forceFlushTimeoutMillis,
      reconfigureLimits(mergedConfig.logRecordLimits),
    );
    this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
  }

  /**
   * Get a logger with the configuration of the LoggerProvider.
   */
  public getLogger(
    name: string,
    version?: string,
    options?: LoggerOptions,
  ): Logger {
    if (this._shutdownOnce.isCalled) {
      diag.warn('A shutdown LoggerProvider cannot provide a Logger');
      return NOOP_LOGGER as Logger;
    }

    if (!name) {
      diag.warn('Logger requested without instrumentation scope name.');
    }
    const loggerName = name || DEFAULT_LOGGER_NAME;
    const key = `${loggerName}@${version || ''}:${options?.schemaUrl || ''}`;
    if (!this._sharedState.loggers.has(key)) {
      this._sharedState.loggers.set(
        key,
        new Logger(
          { name: loggerName, version, schemaUrl: options?.schemaUrl },
          this._sharedState,
        ),
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._sharedState.loggers.get(key)! as Logger;
  }

  /**
   * Adds a new {@link LogRecordProcessor} to this logger.
   * @param processor the new LogRecordProcessor to be added.
   */
  public addLogRecordProcessor(processor: LogRecordProcessor) {
    if (this._sharedState.registeredLogRecordProcessors.length === 0) {
      // since we might have enabled by default a batchProcessor, we disable it
      // before adding the new one
      this._sharedState.activeProcessor
        .shutdown()
        .catch(err =>
          diag.error(
            'Error while trying to shutdown current log record processor',
            err,
          ),
        );
    }
    this._sharedState.registeredLogRecordProcessors.push(processor);
    this._sharedState.activeProcessor = new MultiLogRecordProcessor(
      this._sharedState.registeredLogRecordProcessors,
      this._sharedState.forceFlushTimeoutMillis,
    );
  }

  /**
   * Notifies all registered LogRecordProcessor to flush any buffered data.
   *
   * Returns a promise which is resolved when all flushes are complete.
   */
  public forceFlush(): Promise<void> {
    // do not flush after shutdown
    if (this._shutdownOnce.isCalled) {
      diag.warn('invalid attempt to force flush after LoggerProvider shutdown');
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
  public shutdown(): Promise<void> {
    if (this._shutdownOnce.isCalled) {
      diag.warn('shutdown may only be called once per LoggerProvider');
      return this._shutdownOnce.promise;
    }
    return this._shutdownOnce.call();
  }

  private _shutdown(): Promise<void> {
    return this._sharedState.activeProcessor.shutdown();
  }
}

export class MultiLogRecordProcessor implements LogRecordProcessor {
  constructor(
    public readonly processors: LogRecordProcessor[],
    public readonly forceFlushTimeoutMillis: number,
  ) {}

  public async forceFlush(): Promise<void> {
    const timeout = this.forceFlushTimeoutMillis;
    await Promise.all(
      this.processors.map(processor =>
        callWithTimeout(processor.forceFlush(), timeout),
      ),
    );
  }

  public onEmit(logRecord: LogRecord, context?: Context): void {
    this.processors.forEach(processors => processors.onEmit(logRecord, context));
  }

  public async shutdown(): Promise<void> {
    await Promise.all(this.processors.map(processor => processor.shutdown()));
  }
}


export function loadDefaultConfig() {
  return {
    forceFlushTimeoutMillis: 30000,
    logRecordLimits: {
      attributeValueLengthLimit:
        getEnv().OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: getEnv().OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT,
    },
    includeTraceContext: true,
  };
}

export function reconfigureLimits(
  logRecordLimits: LogRecordLimits,
): Required<LogRecordLimits> {
  const parsedEnvConfig = getEnvWithoutDefaults();

  return {
    attributeCountLimit:
      logRecordLimits.attributeCountLimit ??
      parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT ??
      parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT ??
      DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    attributeValueLengthLimit:
      logRecordLimits.attributeValueLengthLimit ??
      parsedEnvConfig.OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT ??
      parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT ??
      DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
  };
}


export class Logger implements logsAPI.Logger {
  constructor(
    public readonly instrumentationScope: InstrumentationScope,
    private _sharedState: LoggerProviderSharedState,
  ) {}

  public emit(logRecord: logsAPI.LogRecord): void {
    const currentContext = logRecord.context || context.active();
    /**
     * If a Logger was obtained with include_trace_context=true,
     * the LogRecords it emits MUST automatically include the Trace Context from the active Context,
     * if Context has not been explicitly set.
     */
    const logRecordInstance = new LogRecord(
      this._sharedState,
      this.instrumentationScope,
      {
        context: currentContext,
        ...logRecord,
      },
    );
    /**
     * the explicitly passed Context,
     * the current Context, or an empty Context if the Logger was obtained with include_trace_context=false
     */
    this._sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
    /**
     * A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
     * If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
     */
    logRecordInstance._makeReadonly();
  }
}


function isObject(item: any): item is Record<string, unknown> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function merge(target: Record<string, unknown>, source: Record<string, any>): any {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          const targetVal = target[key];
          const sourceVal = source[key];
          if (isObject(targetVal) && isObject(sourceVal)) {
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
