import EventEmitter from 'events';
import util from 'util';
const debuglog = util.debuglog('ib-tws-api');



class IncomeFieldsetHandlerBus {
  constructor(timeoutMs, eventEmitter) {
    this._timeoutMs = timeoutMs;
    this._eventEmitter = eventEmitter;

    this.serverVersion = null;

    this._messageTypeData = {};
    this._requestIdData = {};
    this._resolvesKey = 1;
  }



  emit(event, value) {
    debuglog('sending event ' + event);
    debuglog(value);

    this._eventEmitter.emit(event, value);
  }



  messageTypeResolve(messageTypeId, result) {
    // resolve awaiting promises
    if (this._messageTypeData[messageTypeId]) {
      let resolves = this._messageTypeData[messageTypeId].resolves;
      let timers = this._messageTypeData[messageTypeId].timers;
      delete this._messageTypeData[messageTypeId];

      for (let k in resolves) {
        resolves[k](result);
        clearTimeout(timers[k]);
      }
    }
  }



  messageTypeAddAwaitPromise(messageTypeId, resolve, reject) {
    this._messageTypeInit(messageTypeId);
    let key = this._resolvesKey++;

    this._messageTypeData[messageTypeId].resolves[key] = resolve;
    this._messageTypeData[messageTypeId].rejects[key] = reject;

    this._messageTypeData[messageTypeId].timers[key] = setTimeout(() => {
      if (this._messageTypeData[messageTypeId]) {
        delete this._messageTypeData[messageTypeId].resolves[key];
        delete this._messageTypeData[messageTypeId].rejects[key];

        if (Object.keys(this._messageTypeData[messageTypeId].resolves).length <= 0) {
          delete this._messageTypeData[messageTypeId];
        }
      }

      let e = new Error('ib-tws-api: timeout');
      e.code = 'timeout';
      reject(e);
    }, this._timeoutMs);
  }



  messageTypeStorageArray(messageTypeId) {
    this._messageTypeInit(messageTypeId);
    return this._messageTypeData[messageTypeId].storageArray;
  }



  messageTypeStorageMap(messageTypeId) {
    this._messageTypeInit(messageTypeId);
    return this._messageTypeData[messageTypeId].storageMap;
  }



  _messageTypeInit(messageTypeId) {
    if (!this._messageTypeData[messageTypeId]) {
      this._messageTypeData[messageTypeId] = {
        resolves: {},
        rejects: {},
        timers: {},
        storageArray: [],
        storageMap: {}
      };
    }
  }



  requestIdResolve(requestId, result) {
    // resolve awaiting promises
    if (this._requestIdData[requestId]) {
      let resolves = this._requestIdData[requestId].resolves;
      let timers = this._requestIdData[requestId].timers;
      delete this._requestIdData[requestId];

      for (let k in resolves) {
        resolves[k](result);
        clearTimeout(timers[k]);
      }
    }
  }



  requestIdReject(requestId, result) {
    // resolve awaiting promises
    if (this._requestIdData[requestId]) {
      let rejects = this._requestIdData[requestId].rejects;
      let timers = this._requestIdData[requestId].timers;
      delete this._requestIdData[requestId];

      for (let k in rejects) {
        rejects[k](result);
        clearTimeout(timers[k]);
      }
    }
  }



  requestIdEmit(requestId, event, value) {
    debuglog('sending event ' + requestId + ' ' + event);
    debuglog(value);

    if (!this._requestIdData[requestId]) {
      debuglog('this requestId not awaited');
      return;
    }

    if (event == 'error' &&
        Object.keys(this._requestIdData[requestId].rejects).length) {
      if (this._requestIdData[requestId].resolveOnErrorCode == value.code) {
        this.requestIdResolve(requestId, value);
      } else {
        // it's awaited by promise
        let e = new Error(value.message ? value.message : 'ib-tws-api generic error');
        if (value.message == 'No market data during competing live session') {
          e.code = 'tooManyParallelRequests';
        }
        e.details = value;

        this.requestIdReject(requestId, e);
      }
      return;
    }

    this._requestIdData[requestId].eventEmitter.emit(event, value);
  }



  requestIdEmitter(requestId, stopFunctor) {
    this._requestIdInit(requestId);
    return this._requestIdData[requestId].eventEmitter;
  }



  requestIdDelete(requestId) {
    delete this._requestIdData[requestId];
  }



  requestIdAddAwaitPromiseErrorCode(requestId, errorCode, resolve, reject) {
    let key = this.requestIdAddAwaitPromise(requestId, resolve, reject);
    this._requestIdData[requestId].resolveOnErrorCode = errorCode;
  }



  requestIdAddAwaitPromise(requestId, resolve, reject) {
    this._requestIdInit(requestId);
    let key = this._resolvesKey++;

    this._requestIdData[requestId].resolves[key] = resolve;
    this._requestIdData[requestId].rejects[key] = reject;

    this._requestIdData[requestId].timers[key] = setTimeout(() => {
      if (this._requestIdData[requestId]) {
        delete this._requestIdData[requestId].resolves[key];
        delete this._requestIdData[requestId].rejects[key];

        if (Object.keys(this._requestIdData[requestId].resolves).length <= 0) {
          delete this._requestIdData[requestId];
        }
      }

      let e = new Error('ib-tws-api: timeout');
      e.code = 'timeout';
      reject(e);
    }, this._timeoutMs);

    return key;
  }



  requestIdStorageArray(requestId) {
    this._requestIdInit(requestId);
    return this._requestIdData[requestId].storageArray;
  }



  requestIdStorageMap(requestId) {
    this._requestIdInit(requestId);
    return this._requestIdData[requestId].storageMap;
  }



  _requestIdInit(requestId) {
    if (!this._requestIdData[requestId]) {
      this._requestIdData[requestId] = {
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



export default IncomeFieldsetHandlerBus;
