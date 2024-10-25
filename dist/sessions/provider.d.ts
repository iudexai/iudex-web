import { SessionExporter } from './exporter';
import { Resource } from '@opentelemetry/resources';
interface Session {
    id: string;
    attributes: Record<string, string>;
}
export interface SessionProvider {
    startRecording(): void;
    addSessionAttribute(key: string, value: string): void;
    getActiveSession(): Session;
    flushBuffer(): void;
}
export interface SessionOptions {
    sessionId?: string;
    exporter: SessionExporter;
    resource: Resource;
}
export declare class BasicSessionProvider implements SessionProvider {
    private readonly eventBuffer;
    private readonly activeSession;
    private readonly resource;
    private readonly exporter;
    constructor(sessionOptions: SessionOptions);
    getActiveSession(): Session;
    flushBuffer(): void;
    startRecording(): Promise<void>;
    addSessionAttribute(key: string, value: string): void;
    private handleEvent;
    private shouldFlushBuffer;
    private generateSessionId;
    private _onBeforeUnload;
}
export {};
