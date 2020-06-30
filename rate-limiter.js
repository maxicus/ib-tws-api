
export default class RateLimiter {
  constructor(workload, callsPerSlot, slotIntervalMs, maxQueueLength = Infinity) {
    this._slotIntervalMs = slotIntervalMs;
    this._callsPerSlot = callsPerSlot;
    this._maxQueueLength = maxQueueLength;
    this._queue = [];
    this._workload = workload;
  }



  run(item) {
    if (this.queueLength >= this.maxQueueLength) {
      throw new Error('Too many requests queued');
    }

    return new Promise((resolve, reject) => {
      this._queue.push({ item, resolve, reject });

      if (this._queue.length == 1) {
        process.nextTick(() => {
          this._processQueue();
        });
      }
    });
  }



  cancel() {
    this._queue = [];
  }



  _processQueue() {
    while (this._queue.length > 0) {
      if (this._slot_end == null || Date.now() >= this._slot_end) {
        this._slot_end = Date.now() + this._slotIntervalMs;
        this._slot_remaining = this._callsPerSlot;
      }

      if (this._slot_remaining > 0) {
        const i = this._queue.shift();
        this._slot_remaining--;

        Promise.resolve(this._workload(i.item)).then(i.resolve, i.reject);
      } else {
        if (this._timer) {
          clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => {
          this.timer = null;
          this._processQueue();
        }, this._slot_end - Date.now());
        return;
      }
    }
  }
}
