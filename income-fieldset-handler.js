import util from 'util';
const debuglog = util.debuglog('ib-tws-api');

import IncomeMessageType from './const-income-message-type.js';
import IncomeFieldsetHandlerByType from './income-fieldset-handlers/index.js';
import IncomeFieldsetHandlerBus from './income-fieldset-handler-bus.js';



class IncomeFieldsetHandler {
  constructor(p = {}) {
    this._bus = new IncomeFieldsetHandlerBus(p.timeoutMs, p.eventEmitter);
  }



  setServerVersion(v) {
    this._bus.serverVersion = v;
  }



  processMessageFieldsetBeforeServerVersion(fields) {
    debuglog('processMessageFieldsetBeforeServerVersion');

    if (fields.length == 2) {
      // first message sent after handshake
      this._processByType(IncomeMessageType._SERVER_VERSION, fields);
    }
  }



  processMessageFieldset(fields) {
    this._processByType(parseInt(fields[0]), fields);
  }



  _processByType(messageTypeId, fields) {
    debuglog('processByType. processing message ' + messageTypeId);

    if (!IncomeFieldsetHandlerByType[messageTypeId]) {
      debuglog('unknown message type ID ' + messageTypeId);
      return;
    }

    IncomeFieldsetHandlerByType[messageTypeId].call(this._bus, fields);
  }



  awaitMessageType(messageTypeId) {
    return new Promise((resolve, reject) => {
      this._bus.messageTypeAddAwaitPromise(messageTypeId, resolve, reject);
    });
  }



  awaitRequestId(requestId) {
    return new Promise((resolve, reject) => {
      this._bus.requestIdAddAwaitPromise(requestId, resolve, reject);
    });
  }



  awaitRequestIdErrorCode(requestId, errorCode) {
    return new Promise((resolve, reject) => {
      this._bus.requestIdAddAwaitPromiseErrorCode(requestId, errorCode, resolve, reject);
    });
  }



  requestIdEmitter(requestId, stopFunctor) {
    let eventEmitter = this._bus.requestIdEmitter(requestId, stopFunctor);
    eventEmitter.stop = () => {
      this._bus.requestIdDelete(requestId);
      stopFunctor();
    };

    return eventEmitter;
  }
}



export default IncomeFieldsetHandler;
