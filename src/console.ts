import * as R from 'ramda';
import util from 'util';

import { emitOtelLog } from './utils.js';


export function instrumentConsole() {
  const { log, error, warn, info, debug, timeLog, timeEnd } = console;
  ([
    { name: 'log', logger: log, level: 'INFO' },
    { name: 'error', logger: error, level: 'ERROR' },
    { name: 'warn', logger: warn, level: 'WARN' },
    { name: 'info', logger: info, level: 'INFO' },
    { name: 'debug', logger: debug, level: 'DEBUG'},
    { name: 'timeLog', logger: timeLog, level: 'INFO' },
    { name: 'timeEnd', logger: timeEnd, level: 'INFO' },
  ] as const).forEach(({ name, logger, level }) => {

    console[name] = function (...content: any[]) {
      // Log to console
      logger(...content);

      // Separate out context (attributes) from content
      const contentWoCtx = content
        .filter((c) => !isObject(c) || !('ctx' in c || 'authCtx' in c));
      const contentCtx = R.mergeAll(content
        .filter((c) => isObject(c) && ('ctx' in c || 'authCtx' in c))
        .map(c => {
          if (c.ctx) return c.ctx;
          if (c.authCtx) return c.authCtx;
          return {};
        }),
      );

      // Pretty print pobjects
      const prettyContentWoCtx = contentWoCtx.map((c) => {
        if (typeof c === 'object') {
          try {
            return util.inspect(c);
          } catch {/* ignore */}
        }
        return c;
      });

      // Emit as otel
      emitOtelLog({ level, body: prettyContentWoCtx.join(' '), attributes: contentCtx });
    };
  });
}

function isObject(obj: any): obj is Record<string, any> {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}
