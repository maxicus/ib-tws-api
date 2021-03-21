import EventEmitter from 'events';

export class IncomeFieldsetHandlerBus {

    public serverVersion: number;

    private messageTypeData: Record<string, any>;
    private requestIdData: Record<string, any>;
    private resolvesKey: number;


    constructor(private timeoutMs: number, private eventEmitter: EventEmitter) {
        this.serverVersion = 0;

        this.messageTypeData = {};
        this.requestIdData = {};
        this.resolvesKey = 1;
    }

    emit(event: string | symbol, value: any) {
        return this.eventEmitter.emit(event, value);
    }

    messageTypeResolve(messageTypeId: number, result: any) {
        // resolve awaiting promises
        if (this.messageTypeData[messageTypeId]) {
            const resolves = this.messageTypeData[messageTypeId].resolves;
            const timers = this.messageTypeData[messageTypeId].timers;
            delete this.messageTypeData[messageTypeId];

            for (const k of Object.keys(resolves)) {
                resolves[k](result);
                clearTimeout(timers[k]);
            }
        }
    }

    messageTypeAddAwaitPromise(messageTypeId: number, resolve: (value: any)=>void, reject: (value: any)=>void) {
        this.messageTypeInit(messageTypeId);
        const key = this.resolvesKey++;

        this.messageTypeData[messageTypeId].resolves[key] = resolve;
        this.messageTypeData[messageTypeId].rejects[key] = reject;

        this.messageTypeData[messageTypeId].timers[key] = setTimeout(() => {
            if (this.messageTypeData[messageTypeId]) {
                delete this.messageTypeData[messageTypeId].resolves[key];
                delete this.messageTypeData[messageTypeId].rejects[key];

                if (Object.keys(this.messageTypeData[messageTypeId].resolves).length <= 0) {
                    delete this.messageTypeData[messageTypeId];
                }
            }

            const e = new Error('ib-tws-api: timeout');
            e.name = 'timeout';
            reject(e);
        }, this.timeoutMs);
    }

    messageTypeStorageArray(messageTypeId: number) {
        this.messageTypeInit(messageTypeId);
        return this.messageTypeData[messageTypeId].storageArray;
    }

    messageTypeStorageMap(messageTypeId: number) {
        this.messageTypeInit(messageTypeId);
        return this.messageTypeData[messageTypeId].storageMap;
    }

    private messageTypeInit(messageTypeId: number) {
        if (!this.messageTypeData[messageTypeId]) {
            this.messageTypeData[messageTypeId] = {
                resolves: {},
                rejects: {},
                timers: {},
                storageArray: [],
                storageMap: {}
            };
        }
    }

    requestIdResolve(requestId: number, result: any) {
        // resolve awaiting promises
        if (this.requestIdData[requestId]) {
            const resolves = this.requestIdData[requestId].resolves;
            const timers = this.requestIdData[requestId].timers;
            delete this.requestIdData[requestId];

            for (const k of Object.keys(resolves)) {
                resolves[k](result);
                clearTimeout(timers[k]);
            }
        }
    }

    requestIdReject(requestId: number, result: any) {
        // resolve awaiting promises
        if (this.requestIdData[requestId]) {
            const rejects = this.requestIdData[requestId].rejects;
            const timers = this.requestIdData[requestId].timers;
            delete this.requestIdData[requestId];

            for (const k of Object.keys(rejects)) {
                rejects[k](result);
                clearTimeout(timers[k]);
            }
        }
    }

    requestIdEmit(requestId: number, event: string, value: any) {

        if (!this.requestIdData[requestId]) {
            return;
        }

        if (event === 'error' &&
            Object.keys(this.requestIdData[requestId].rejects).length) {
            if (this.requestIdData[requestId].resolveOnErrorCode === value.code) {
                this.requestIdResolve(requestId, value);
            } else {
                // it's awaited by promise
                const e = new Error(value.message ? value.message : 'ib-tws-api generic error');
                if (value.message === 'No market data during competing live session') {
                    e.name = 'tooManyParallelRequests';
                }

                this.requestIdReject(requestId, e);
            }
            return;
        }

        this.requestIdData[requestId].eventEmitter.emit(event, value);
    }

    requestIdEmitter(requestId: number) {
        this.requestIdInit(requestId);
        return this.requestIdData[requestId].eventEmitter;
    }

    requestIdDelete(requestId: number) {
        delete this.requestIdData[requestId];
    }

    requestIdAddAwaitPromiseErrorCode(requestId: number, errorCode: string, resolve: (value: any)=>void, reject: (value: any)=>void) {
        const key = this.requestIdAddAwaitPromise(requestId, resolve, reject);
        this.requestIdData[requestId].resolveOnErrorCode = errorCode;
    }

    requestIdAddAwaitPromise(requestId: number, resolve: (value: any)=>void, reject: (value: any)=>void) {
        this.requestIdInit(requestId);
        const key = this.resolvesKey++;

        this.requestIdData[requestId].resolves[key] = resolve;
        this.requestIdData[requestId].rejects[key] = reject;

        this.requestIdData[requestId].timers[key] = setTimeout(() => {
            if (this.requestIdData[requestId]) {
                delete this.requestIdData[requestId].resolves[key];
                delete this.requestIdData[requestId].rejects[key];

                if (Object.keys(this.requestIdData[requestId].resolves).length <= 0) {
                    delete this.requestIdData[requestId];
                }
            }

            const e = new Error('ib-tws-api: timeout');
            e.name = 'timeout';
            reject(e);
        }, this.timeoutMs);

        return key;
    }

    requestIdStorageArray(requestId: number) {
        this.requestIdInit(requestId);
        return this.requestIdData[requestId].storageArray;
    }

    requestIdStorageMap(requestId: number) {
        this.requestIdInit(requestId);
        return this.requestIdData[requestId].storageMap;
    }

    private requestIdInit(requestId: number) {
        if (!this.requestIdData[requestId]) {
            this.requestIdData[requestId] = {
                resolves: {},
                rejects: {},
                timers: {},
                eventEmitter: new EventEmitter(),
                storageArray: [],
                storageMap: {},
            };
        }
    }
}
