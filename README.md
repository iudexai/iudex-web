# IUDEX Web

Next generation observability. For Node compatible IUDEX, use [iudex-node](https://github.com/iudexai/iudex-node-module#readme).

### Table of contents
- [IUDEX Web](#iudex-web)
    - [Table of contents](#table-of-contents)
- [Getting Started](#getting-started)
    - [NextJS](#nextjs)
    - [Create React App (CRA)](#create-react-app-cra)
    - [Autoinstrument](#autoinstrument)
    - [Cloudflare Workers](#cloudflare-workers)
    - [Console](#console)
    - [Custom logger](#custom-logger)
    - [Tracing functions](#tracing-functions)
- [Session Replay](#session-replay)
- [Slack Alerts](#slack-alerts)
- [API reference](#api-reference)
    - [instrument](#instrument)
      - [Options](#options)
    - [emitOtelLog](#emitotellog)
      - [Options](#options-1)
    - [trackAttribute](#trackattribute)
    - [withTracing](#withtracing)
      - [Example](#example)
      - [Arguments](#arguments)
    - [useTracing](#usetracing)
      - [Example](#example-1)


# Getting Started
Instrumenting your code with IUDEX just takes a few steps.

1. Install dependencies.
```bash
npm install iudex-web
```
2. Follow the below instructions for your frameworks or use autoinstrumentation.
3. Make sure your app has access to the environment variable `IUDEX_API_KEY`. You can manually add this to `instrument` as well if you use something like a secrets manager.
4. You should be all set! Go to [https://app.iudex.ai/](https://app.iudex.ai/) and enter your API key.
5. Go to [https://app.iudex.ai/logs](https://app.iudex.ai/logs) and press `Search` to view your logs.


### NextJS
We will follow the first half of [NextJS's OpenTelemetry Guide](https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry) then make a few changes to introduce IUDEX features and pipe the telemetry to the IUDEX backend which then can be viewed at [https://app.iudex.ai/traces](https://app.iudex.ai/traces).

1. Add `experimental.instrumentationHook = true`; in your `next.config.js`
2. Install vercel otel and iudex-web `npm install @vercel/otel iudex-web`
3. Create a file `instrumentation.ts` in your project source root (or `src` if you're using one).
4. Add this to `instrumentation.ts`
```typescript
import { registerOTel } from '@vercel/otel';
import { registerOTelOptions } from 'iudex-web';

export function register() {
  const options = registerOTelOptions({
    serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
      publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
  });
  registerOTel(options);
}
```
5. Go to [https://app.iudex.ai/traces](https://app.iudex.ai/traces) to view your NextJS traces.


### Create React App (CRA)

1. Add this code to the top your entrypoint file (likely `index.ts`).
```typescript
import { instrument } from 'iudex-web';
instrument({
  serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
});

console.log('Hello Iudex!'); // Test logging
```
2. Go to [https://app.iudex.ai/logs](https://app.iudex.ai/logs) to view your React app logs.


### Autoinstrument

Some functions are automatically tracked:

✅ console
✅ document.onload
✅ fetch
✅ addEventListener
✅ xmlHttpRequest

Add this code to the top your entrypoint file (likely `index.ts`).
```typescript
import { instrument } from 'iudex-web';
instrument({
  serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
});
```
You should be all set! IUDEX will now record logs and trace the entire life cycle for each request.

Go to [https://app.iudex.ai/](https://app.iudex.ai/) to start viewing your logs and traces!

For libraries that are not autoinstrumented or if your project uses `'type': 'module'`, follow the instructions from the table of contents for that specific library.


###  Cloudflare Workers
Cloudflare workers operate differently than the browser environment due to how the environment is loaded and what global objects are available. Wrap your export handler object with `trace` to trace all ExportHandler functions.

```typescript
import { instrument, iudexCloudflare } from 'iudex-web';
instrument({
  serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
});
const { trace, withTracing } = iudexCloudflare;
import { ExportedHandler } from '@cloudflare/workers-types';

export default trace({
  fetch: async (request, env, ctx) => {
    // Your fetch handler goes here
  },
} satisfies ExportedHandler, { name: <your_service_name> });
```

If you only want to trace specific ExportHandler functions, you can wrap the specific functions with `withTracing`.

```typescript
import { instrument, iudexCloudflare } from 'iudex-web';
instrument({
  serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
});
const { trace, withTracing } = iudexCloudflare;
import { ExportedHandler, ExportedHandlerFetchHandler } from '@cloudflare/workers-types';

export default {
  fetch: withTracing(async (request, env, ctx) => {
    // Your fetch handler goes here
  }, { name: <your_service_name> }) satisfies ExportedHandlerFetchHandler,
} satisfies ExportedHandler;
```


### Console
Add this code snippet to the top your entry point file (likely `index.ts`). Skip this step if you already call `instrument` on your server.

```typescript
import { instrument, iudexFastify } from 'iudex-web';
instrument({
  serviceName: 'YOUR_SERVICE_NAME', // highly encouraged
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', // only ever commit your WRITE ONLY key
});
```

Objects with the key `ctx` will have values in `ctx` added as attributes to the log. Example:
```typescript
console.log('hello', { ctx: { userId: '123' } })
```
will create a log line with the `userId` attribute set to `123`.


### Custom logger
Use `emitOtelLog` to send logs to `iudex`. You have have called `instrument` somewhere before `emitOtelLog`.

```typescript
import { emitOtelLog } from 'iudex-web';

/**
 * Custom logger example
 */
function createLogger(level: keyof typeof console) {
  return function logger(body: string, attributes: Record<string, any>) {
    console[level](body, attributes);
    emitOtelLog({ level, body, attributes })
  };
}
```


### Tracing functions
Its recommended that you trace functions that are not called extremely frequently and that tends to be an 'entry point' for complex functionality. Examples of this are API routes, service controllers, and database clients. You can trace your function by wrapping it with `withTracing`.

```typescript
import { withTracing } from 'iudex-web';

const myFunction = withTracing(async () => {
  console.log('I am traced');
}, { name: 'myFunction', trackArgs: true });

await myFunction();
// console: I am traced
```

Anytime `myFunction` is called, it will create a span layer in a trace. `trackArgs` will also track the arguments for the function. Tracked arguments will be truncated at 5000 characters. If you want to track specific parameters, it is recommended that you log them at the beginning of the function.

# Session replay
IUDEX comes with session replay functionality out of the box. Session replay enhances observability by allowing teams to visually reconstruct user interactions, providing crucial context for debugging, performance analysis, and user experience improvement. 

### Privacy
Privacy is an important consideration when it comes to session replay. By default, IUDEX does not collect any password information and [masks PII on the client side](https://github.com/iudexai/ghost-shell/blob/rashid-session-replay-docs/modules/iudex-web/src/sessions/utils.ts#L15). If there are any elements that you want to totally hide/redact from the session replay, you can add the `iudex-block` CSS class to the elements you want to remove.

```html
<div class="iudex-block">Secrets!</div>
```

If you want to opt out of session replay entirely, you can disable it in the settings.

```typescript
instrument({
  serviceName: 'YOUR_SERVICE_NAME',
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', 
  settings: {
    disableSessionReplay: true
  }
});
```

### Sampling
By default, IUDEX records all user interactions. For cost or bandwidth considerations, you can set a sample rate to only collect a subset of sessions.

```typescript
instrument({
  serviceName: 'YOUR_SERVICE_NAME',
  publicWriteOnlyIudexApiKey: 'YOUR_PUBLIC_WRITE_ONLY_KEY', 
  settings: {
    sessionReplaySampleRate: 0.1 // 10% of sessions will be recorded
  }
});
```

# Slack Alerts
You can easily configure Slack alerts on a per-log basis with custom filters an logic by adding it in code.

1. Visit [https://app.iudex.ai/logs](https://app.iudex.ai/logs) and click on the `Add to Slack` button in the top right.

2.  Once installed to your workspace, tag your logs with the `iudex.slack_channel_id` attribute.
```typescript
// Example using logger
logger.info({ 'iudex.slack_channel_id': 'YOUR_SLACK_CHANNEL_ID' }, 'Hello from Slack!');
// Example using console, you must set { ctx }
console.log('Hello from Slack!', { ctx: { 'iudex.slack_channel_id': 'YOUR_SLACK_CHANNEL_ID' } });
```

3. Your channel ID can be found by clicking the name of the channel in the top left, then at the bottom of the dialog that pops up.

4. As long as the channel is public or you've invited the IUDEX app, logs will be sent as messages to their tagged channel any time they are logged.


# API reference
The `iudex` package contains the function `instrument` which automatically attaches to libraries you use
and starts sending trace data to `iudex`. Separately, logs sent via console are also sent. If you use another
logger library, find its instrumentation instructions or manually call `emitOtelLog` to send a log.

### instrument
`instrument` is a function that automatically attaches to libraries you use and starts sending trace data to `iudex`.

#### Options
* `baseUrl?: string`
  * Sets the url to send the trace and log events to.
  * By default this is `api.iudex.ai`.
* `iudexApiKey?: string`
  * Sets the api key to send logs.
  * By default this looks for an api key in `process.env.IUDEX_API_KEY`.
* `publicWriteOnlyIudexApiKey?: string`
  * Sets the api key to send logs.
  * By default this looks for an api key in `process.env.PUBLIC_WRITE_ONLY_IUDEX_API_KEY`.
* `serviceName?: string`
  * Sets the service name for the instrumented logs.
  * While optional, setting this is highly recommended.
* `instanceId?: string`
  * Sets the id of the runtime instance.
* `gitCommit?: string`
  * Sets the associated git commit hash for the runtime.
  * This is optional but setting it will help track deployments.
  * By default this parses the commit from the runtime's git instance if available.
* `githubUrl?: string`
  * Sets the GitHub url so logs with associated filenames can be hyperlinked.
  * Git commit hash is also required for the hyperlinking.
* `env?: string`
  * Sets the environment of the logs and traces
  * While optional, this is highly recommended because separating development vs production logs denoises both.
  * By default uses `process.env.NODE_ENV`
* `headers?: Record<string, string>`
  * Merges into the header object for the fetch that targets the `baseUrl`.
* `settings?: Record<string, boolean>`
  * Optionally turn off specified instrumentations by setting it to `false`.
    * instrumentConsole


### emitOtelLog
`emitOtelLog` is a function that sends a log to `iudex`.

#### Options
* `level: string`
  * Sets level (`INFO`, `WARN`, `ERROR`, `FATAL`, `DEBUG`) of the log.
* `body: any`
  * Sets the content of the log.
* `severityNumber?: number`
  * Sets the severity of the log as a number.
  * `level` overwrites this.
* `attributes?: Record<string, any>`
  * Sets attributes of the log.
    * We highly recommend sending at least userId and requestId.
    * We suggest sending function or file name.
  * Attributes cannot contain nonserializable objects.

### trackAttribute
`trackAttribute` adds an attribute to the current active span.
* `key: string`
* `value: any`

### withTracing
`withTracing` instruments a function by wrapping with a trace context. Wrapped functions can be called elsewhere and will always be traced.

#### Example
```typescript
import { withTracing } from 'iudex-web';

const myFunction = withTracing(async () => {
  console.log('I am traced');
}, { name: 'myFunction' });

await myFunction();
// console: I am traced
```

#### Arguments
* `fn: Function`
  * Function to trace.
* `opts`
  * `name?: string`
    * Name of the trace.
  * `trackArgs?: boolean`
    * Toggles whether or not to track arguments passed into the function.
    * Tracked args are stored in `attributes.arg` or `attributes.args` if there are multiple arguments.
    * Defaults to false.
  * `attributes?: Record<string, any>`
    * Sets attributes of the trace.
  * `setSpan?: (span: Span, ret: ReturnType<Function>) => void`
    * Overrides handling the span.

### useTracing
`useTracing` instruments and runs a function with trace context. The arguments are the same as `withTracing`

#### Example
```typescript
import { useTracing } from 'iudex-web';

await useTracing(async () => {
  console.log('I am traced');
}, { name: 'myFunction' });
// console: I am traced
```
