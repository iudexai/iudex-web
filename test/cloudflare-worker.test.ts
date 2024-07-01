import {
  ExportedHandler,
  ExportedHandlerFetchHandler,
  Response,
} from '@cloudflare/workers-types';

import { withTracing, trace } from '../src/cloudflare-worker';

const e = {
  fetch: withTracing(async (request, env, ctx) => {
    console.warn('Hello Cloudflare Workers!', new Date());
    return new Response('Hello! 2');
  }, { name: 'fetch', trackArgs: false }) satisfies ExportedHandlerFetchHandler,
} satisfies ExportedHandler;

const ee = trace({
  fetch: async (request, env, ctx) => {
    console.warn('Hello Cloudflare Workers!', new Date());
    return new Response('Hello! 2');
  },
} satisfies ExportedHandler, { name: 'exportedHandler' });
