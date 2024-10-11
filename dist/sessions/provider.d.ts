import { SessionExporter } from './exporter';
interface Session {
    id: string;
}
export interface SessionProvider {
    getActiveSession(): Session;
    flushBuffer(): void;
}
export interface SessionOptions {
    sessionId?: string;
    exporter: SessionExporter;
    sampleRate?: number;
}
export declare class BasicSessionProvider implements SessionProvider {
    private readonly eventBuffer;
    private readonly activeSession;
    private readonly exporter;
    private readonly sampleRate;
    constructor(sessionOptions: SessionOptions);
    getActiveSession(): Session;
    flushBuffer(): void;
    private initializeRecording;
    private handleEvent;
    private shouldFlushBuffer;
    private generateSessionId;
    private _onBeforeUnload;
}
export {};
