import { eventWithTime } from '@rrweb/types';

interface SessionChunk {
  sessionId: string;
  events: eventWithTime[];
}

export class SessionExporter {
  private readonly url: string;
  private readonly headers: Record<string, string> = {};
  private queue: SessionChunk[] = [];
  private isUploading = false;
  private readonly interval: number;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor({
    url,
    headers,
    interval,
  }: {
    url: string;
    headers: Record<string, string>;
    interval: number;
  }) {
    this.url = url;
    this.headers = headers;
    this.interval = interval;
  }

  public addToQueue(chunk: SessionChunk): void {
    this.queue.push(chunk);
    this.scheduleUpload();
  }

  private scheduleUpload(): void {
    if (!this.isUploading && !this.timeoutId) {
      this.timeoutId = setTimeout(() => this.startUploading(), this.interval);
    }
  }

  private async startUploading(): Promise<void> {
    if (this.isUploading || this.queue.length === 0) {
      this.timeoutId = null;
      return;
    }

    this.isUploading = true;
    const chunk = this.queue[0]; // peek for type checking
    this.queue.shift();

    try {
      await this.uploadChunk(chunk);
    } catch (error) {
      console.info('Failed to upload chunk:', error);
      this.queue.unshift(chunk);
    } finally {
      this.isUploading = false;
      this.timeoutId = null;
      this.scheduleUpload();
    }
  }

  private async uploadChunk(chunk: SessionChunk): Promise<void> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk: ${response.statusText}`);
    }
  }

  public shutdown(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    // try to upload remaining chunks
    if (this.queue.length > 0) {
      const promises = this.queue.map((chunk) => this.uploadChunk(chunk));
      Promise.allSettled(promises).then((results) => {
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Uploaded ${results.length - failed} chunks, ${failed} failed`);
      }).catch((error) => {
        console.warn('Failed to upload remaining chunks:', error);
      });
    }
  }
}
