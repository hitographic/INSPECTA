class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 3;
  private abortController: AbortController | null = null;

  setMaxConcurrent(max: number) {
    this.maxConcurrent = max;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          if (this.abortController?.signal.aborted) {
            throw new Error('Request aborted');
          }
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift();

    if (fn) {
      try {
        await fn();
      } catch (error) {
        console.error('[REQUEST QUEUE] Error:', error);
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  abort() {
    if (!this.abortController) {
      this.abortController = new AbortController();
    }
    this.abortController.abort();
    this.queue = [];
    this.running = 0;
    console.log('[REQUEST QUEUE] Aborted all pending requests');
  }

  reset() {
    this.abortController = null;
    this.queue = [];
    this.running = 0;
  }

  getStatus() {
    return {
      queued: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent
    };
  }
}

export const requestQueue = new RequestQueue();
