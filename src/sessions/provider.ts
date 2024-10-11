import { eventWithTime } from '@rrweb/types';
import { SessionExporter } from './exporter';
import cuid from './safeCuid.js';
import { defaultMaskText } from './utils';

const MAX_BUFFER_SIZE = 200;
const MAX_CHUNK_BYTES = 16 * 1024 * 1024; // 16MB

interface Session {
  id: string;
}

interface Buffer {
  count: number;
  size: number;
  events: eventWithTime[];
}

export interface SessionProvider {
  // startRecording(): void;
  // stopRecording(): void;
  // attachUser(userId: string): void;
  getActiveSession(): Session;
  flushBuffer(): void;
}

export interface SessionOptions {
  sessionId?: string;
  exporter: SessionExporter;
  sampleRate?: number;
}

export class BasicSessionProvider implements SessionProvider {
  private readonly eventBuffer: Buffer;
  private readonly activeSession: Session;
  private readonly exporter: SessionExporter;
  private readonly sampleRate: number;

  constructor(sessionOptions: SessionOptions) {
    this.exporter = sessionOptions.exporter;
    this.sampleRate = sessionOptions.sampleRate ?? 1.0;
    const sessionId = sessionOptions.sessionId ?? this.generateSessionId();
    this.activeSession = { id: sessionId };
    this.eventBuffer = {
      count: 0,
      size: 0,
      events: [],
    };
    void this.initializeRecording();
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
  }

  private async initializeRecording(): Promise<void> {
    // Psuedo-randomly sample sessions
    const sessionId = this.activeSession.id;
    const random = Math.abs(
      Math.sin(sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)),
    );
    const shouldSample = random < this.sampleRate;
    if (!shouldSample) {
      return;
    }

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
      console.error('Failed to initialize recording:', error);
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
    return this.eventBuffer.count > MAX_BUFFER_SIZE || this.eventBuffer.size > MAX_CHUNK_BYTES;
  }

  private generateSessionId(): string {
    return `ses_${cuid()}`;
  }

  private _onBeforeUnload = () => {
    this.flushBuffer();
    this.exporter.shutdown();
  };
}
