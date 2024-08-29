import {
  LogRecordProcessor,
  LogRecord,
} from '@opentelemetry/sdk-logs';

export class RedactLogProcessor implements LogRecordProcessor {
  redactFn: (logRecord: LogRecord) => void;

  constructor(
    public redact: RegExp | string | ((logRecord: LogRecord) => void),
  ) {
    this.redactFn = typeof redact === 'function'
      ? redact
      : (logRecord: LogRecord) => {
        if (typeof logRecord.body === 'string') {
          logRecord.setBody(logRecord.body.replace(redact, 'REDACTED'));
        }
      };
  }

  onEmit(logRecord: LogRecord) {
    this.redactFn(logRecord);
  }

  forceFlush() {
    return Promise.resolve();
  }

  shutdown() {
    return Promise.resolve();
  }
}
