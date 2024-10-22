import { SessionExporter } from './exporter';
interface Session {
    id: string;
}
export interface SessionProvider {
    startRecording(): void;
    getActiveSession(): Session;
    flushBuffer(): void;
}
export interface SessionOptions {
    sessionId?: string;
    exporter: SessionExporter;
}
export declare class BasicSessionProvider implements SessionProvider {
    private readonly eventBuffer;
    private readonly activeSession;
    private readonly exporter;
    constructor(sessionOptions: SessionOptions);
    getActiveSession(): Session;
    flushBuffer(): void;
    startRecording(): Promise<void>;
    private handleEvent;
    private shouldFlushBuffer;
    private generateSessionId;
    private _onBeforeUnload;
}
export {};
