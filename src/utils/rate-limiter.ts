
/**
 * Information about data that will be processed,
 * as well as what happens on completion/error
 */
export interface DeferredWorkload {
    item: any
    expireDate?: number;
    resolve: (value: any) => any,
    reject: (value: any) => any
}

/**
 * Helper class for processing a queue of data at a limited speed
 */
export class RateLimiter {

    private timer?: NodeJS.Timeout;
    private queue: DeferredWorkload[];
    private slotEnd?: number;
    private slotRemaining: number;

    constructor(
        private workload: (data: any) => void,
        private callsPerSlot: number,
        private slotIntervalMs: number,
        private timeoutMs: number
    ) {
        this.queue = [];
        this.slotRemaining = callsPerSlot;
    }

    /**
     * Executes the rate limiter workload on the data
     * as soon as possible
     * @param item The data to process in the workload
     * @returns A promise bound to the item and workload
     */
    public run(item: any) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                item,
                resolve,
                reject
            });

            if (this.queue.length === 1) {
                process.nextTick(() => {
                    this.processQueue();
                });
            }
        });
    }

    /**
     * Executes the rate limiter workload on the data
     * as soon as possible, failing to execute if not executed
     * within a period of time
     * @param item The data to process in the workload
     * @returns A promise bound to the item and workload
     */
    public runExpirable(item: any[]) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                item,
                resolve,
                reject,
                expireDate: Date.now() + this.timeoutMs
            });

            if (this.queue.length === 1) {
                process.nextTick(this.processQueue);
            }
        });
    }

    /**
     * Clears the queue of all tasks
     */
    public cancel() {
        this.queue = [];
    }

    /**
     * Processes data in the queue by running the provided workload callback
     * on all of the data in the queue
     */
    private processQueue() {
        while (this.queue.length > 0) {
            if (this.slotEnd == null || Date.now() >= this.slotEnd) {
                this.slotEnd = Date.now() + this.slotIntervalMs;
                this.slotRemaining = this.callsPerSlot;
            }

            if (this.slotRemaining > 0) {
                const i = this.queue.shift() as DeferredWorkload;

                if (!i.expireDate || i.expireDate < Date.now()) {
                    // expired requests just ignored since timeout handled by
                    // IncomeFieldsetHandler.awaitRequestId
                    this.slotRemaining--;
                    Promise.resolve(this.workload(i.item)).then(i.resolve, i.reject);
                }
            } else {
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                this.timer = setTimeout(() => {
                    delete this.timer;
                    this.processQueue();
                }, this.slotEnd - Date.now());
                return;
            }
        }
    }
}
