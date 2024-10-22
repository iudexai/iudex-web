import { eventWithTime } from '@rrweb/types';
import { SessionExporter } from './exporter';
import cuid from './safeCuid.js';
import { defaultMaskText } from './utils';

const MAX_BUFFER_SIZE = 100;
const MAX_CHUNK_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_TIME_BETWEEN_CHUNKS = 1000 * 30; // 30 seconds

interface Session {
  id: string;
}

interface Buffer {
  count: number;
  size: number;
  events: eventWithTime[];
  startTime: number;
}

export interface SessionProvider {
  startRecording(): void;
  // stopRecording(): void;
  // attachUser(userId: string): void;
  getActiveSession(): Session;
  flushBuffer(): void;
}

export interface SessionOptions {
  sessionId?: string;
  exporter: SessionExporter;
}

export class BasicSessionProvider implements SessionProvider {
  private readonly eventBuffer: Buffer;
  private readonly activeSession: Session;
  private readonly exporter: SessionExporter;

  constructor(sessionOptions: SessionOptions) {
    this.exporter = sessionOptions.exporter;
    const sessionId = sessionOptions.sessionId ?? this.generateSessionId();
    this.activeSession = { id: sessionId };
    this.eventBuffer = {
      count: 0,
      size: 0,
      events: [],
      startTime: new Date().getTime(),
    };
  }

  public getActiveSession(): Session {
    return this.activeSession;
  }

  public flushBuffer(): void {
    if (this.eventBuffer.count === 0) {
      return;
    }

    const chunk = {
      sessionId: this.activeSession.id,
      events: [...this.eventBuffer.events],
    };
    this.exporter.addToQueue(chunk);

    // Clear buffer
    this.eventBuffer.count = 0;
    this.eventBuffer.size = 0;
    this.eventBuffer.events = [];
    this.eventBuffer.startTime = new Date().getTime();
  }

  public async startRecording(): Promise<void> {
    try {
      const { record } = await import('rrweb');
      record({
        emit: this.handleEvent.bind(this),
        blockClass: 'iudex-block',
        ignoreClass: 'iudex-ignore',
        maskAllInputs: true,
        maskTextSelector: '*', // Mask all text
        maskTextFn: defaultMaskText,
        maskInputFn: defaultMaskText,
      });

      window?.addEventListener('beforeunload', this._onBeforeUnload);
    } catch (error) {
      console.info('Failed to initialize recording:', error);
    }
  }

  private handleEvent(event: eventWithTime): void {
    this.eventBuffer.events.push(event);
    this.eventBuffer.count += 1;
    this.eventBuffer.size += JSON.stringify(event).length;

    if (this.shouldFlushBuffer()) {
      this.flushBuffer();
    }
  }

  private shouldFlushBuffer(): boolean {
    return (
      this.eventBuffer.count > MAX_BUFFER_SIZE ||
      this.eventBuffer.size > MAX_CHUNK_BYTES ||
      new Date().getTime() - this.eventBuffer.startTime > MAX_TIME_BETWEEN_CHUNKS
    );
  }

  private generateSessionId(): string {
    return `ses_${cuid()}`;
  }

  private _onBeforeUnload = () => {
    this.flushBuffer();
    this.exporter.shutdown();
  };
}
