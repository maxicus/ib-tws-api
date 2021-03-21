
import EventEmitter from 'events';
import { IncomeFieldsetHandlerBus } from './income-fieldset-handler-bus';
import IncomeMessageType from '../constants/income-message-type';
import IncomeFieldsetHandlerByType from '../income-fieldset-handlers';
/**
 * Base class for handling incomming fieldsets.
 * Should  be extended to add handlers for different message types
 */
export class IncomeFieldsetHandler {

    bus: IncomeFieldsetHandlerBus;

    constructor(timeoutMs: number, eventEmitter: EventEmitter) {
        this.bus = new IncomeFieldsetHandlerBus(timeoutMs, eventEmitter);
    }

    setServerVersion(v: number) {
        this.bus.serverVersion = v;
    }

    processMessageFieldsetBeforeServerVersion(fields: any[]) {

        if (fields.length === 2) {
            // first message sent after handshake
            this.processByType(IncomeMessageType._SERVER_VERSION, fields);
        }
    }

    processMessageFieldset(fields: any[]) {
        this.processByType(parseInt(fields[0]), fields);
    }

    private processByType(messageTypeId: number, fields: any[]) {

        if (!IncomeFieldsetHandlerByType[messageTypeId]) {
            return;
        }

        IncomeFieldsetHandlerByType[messageTypeId].call(this.bus, fields);
    }

    awaitMessageType(messageTypeId: number) {
        return new Promise((resolve, reject) => {
            this.bus.messageTypeAddAwaitPromise(messageTypeId, resolve, reject);
        });
    }

    awaitRequestId(requestId: number) {
        return new Promise((resolve, reject) => {
            this.bus.requestIdAddAwaitPromise(requestId, resolve, reject);
        });
    }

    awaitRequestIdErrorCode(requestId: number, errorCode: string) {
        return new Promise((resolve, reject) => {
            this.bus.requestIdAddAwaitPromiseErrorCode(requestId, errorCode, resolve, reject);
        });
    }

    requestIdEmitter(requestId: number, stopFunctor: ()=>void) {
        const eventEmitter = this.bus.requestIdEmitter(requestId);
        eventEmitter.stop = () => {
            this.bus.requestIdDelete(requestId);
            stopFunctor();
        };

        return eventEmitter;
    }


}