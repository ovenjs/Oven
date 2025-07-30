export class Bucket {
  public id: string;
  public limit: number;
  public remaining: number;
  public reset: number;
  private queue: Array<() => void> = [];
  private processing: boolean = false;

  constructor(id: string, limit: number, remaining: number, reset: number) {
    this.id = id;
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
  }

  update(limit: number, remaining: number, reset: number): void {
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
  }

  async wait(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    // Check if we need to wait for rate limit reset
    const now = Date.now();
    if (this.remaining <= 0 && now < this.reset) {
      const waitTime = this.reset - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Process queued requests
    while (this.queue.length > 0 && this.remaining > 0) {
      const resolve = this.queue.shift()!;
      this.remaining--;
      resolve();
    }

    this.processing = false;

    // Continue processing if there are more requests
    if (this.queue.length > 0) {
      setImmediate(() => this.process());
    }
  }
}
