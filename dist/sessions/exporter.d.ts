import { eventWithTime } from '@rrweb/types';
interface SessionChunk {
    sessionId: string;
    events: eventWithTime[];
}
export declare class SessionExporter {
    private readonly url;
    private readonly headers;
    private queue;
    private isUploading;
    private readonly interval;
    private timeoutId;
    constructor({ url, headers, interval, }: {
        url: string;
        headers: Record<string, string>;
        interval: number;
    });
    addToQueue(chunk: SessionChunk): void;
    private scheduleUpload;
    private startUploading;
    private uploadChunk;
    shutdown(): void;
}
export {};
