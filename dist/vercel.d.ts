import type { registerOTel as vercelRegisterOtel } from '@vercel/otel';
import { InstrumentConfig } from './instrument.js';
type Configuration = Exclude<Parameters<typeof vercelRegisterOtel>[0], string | undefined>;
export declare function registerOTelOptions(optionsOrServiceName?: (Configuration & InstrumentConfig) | string): any;
export {};
