import util from 'util';
const debuglog = util.debuglog('ib-tws-api');



export default class RateLimiter {
  constructor(workload, callsPerSlot, slotIntervalMs, timeoutMs) {
    this._slotIntervalMs = slotIntervalMs;
    this._callsPerSlot = callsPerSlot;
    this._timeoutMs = timeoutMs;
    this._queue = [];
    this._workload = workload;
  }



  run(item) {
    return new Promise((resolve, reject) => {
      this._queue.push({
        item,
        resolve,
        reject
      });

      if (this._queue.length == 1) {
        process.nextTick(() => {
          this._processQueue();
        });
      }
    });
  }



  runExpirable(item) {
    return new Promise((resolve, reject) => {
      this._queue.push({
        item,
        resolve,
        reject,
        expireDate: Date.now() + this._timeoutMs
      });

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

        if (i.expireDate && i.expireDate < Date.now()) {
          // expired requests just ignored since timeout handled by
          // IncomeFieldsetHandler.awaitRequestId
          debuglog('RateLimiter: expired item ignored ' + i.item);
        } else {
          this._slot_remaining--;
          Promise.resolve(this._workload(i.item)).then(i.resolve, i.reject);
        }
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
