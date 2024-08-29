import { LogRecordProcessor, LogRecord } from '@opentelemetry/sdk-logs';
export declare class RedactLogProcessor implements LogRecordProcessor {
    redact: RegExp | string | ((logRecord: LogRecord) => void);
    redactFn: (logRecord: LogRecord) => void;
    constructor(redact: RegExp | string | ((logRecord: LogRecord) => void));
    onEmit(logRecord: LogRecord): void;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
}
