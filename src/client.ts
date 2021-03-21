import { EventEmitter } from 'events';
import { ProtocolBytes } from './utils/protocol-bytes';
import { RateLimiter } from './utils/rate-limiter';
import IncomeMessageType from './constants/income-message-type';
import { IncomeFieldsetHandler } from './utils/income-fieldset-handler';
import OutcomeMessageType from './constants/outcome-message-type';

export interface ConnectionParameters {
    /** Host of the server to connect to (defaults to 127.0.0.1) */
    host?: string;
    /** Port to connect on for the client (defaults to 4901) */
    port: number;
    /** Id of the client connection (defaults to 1) */
    clientId?: number;
    /** Timeout in msec for request/response calls */
    timeoutMs?: number;
}

export class Client {

    private emitter: EventEmitter;
    private connectionPromise: Promise<void> | null;
    private connected: boolean;
    private serverVersion: number;
    private protocolBytes: ProtocolBytes;
    private rateLimiter: RateLimiter;

    private host: string;
    private port: number;
    private clientId: number;
    private timeoutMs: number;

    private nextValidId: number;

    private incomeHandler: IncomeFieldsetHandler;


    constructor(connectionParameters: ConnectionParameters, errorHandler = (e: Error) => { return; }) {
        this.emitter = new EventEmitter();
        this.emitter.on('error', errorHandler);
        this.connectionPromise = null;
        this.connected = false;
        this.serverVersion = 0;

        this.host = connectionParameters.host || '127.0.0.1';
        this.port = connectionParameters.port || 4201;
        this.clientId = connectionParameters.clientId || 1;
        this.timeoutMs = connectionParameters.timeoutMs || 30000;

        this.nextValidId = 0;

        // Build protocol bytes object
        this.protocolBytes = new ProtocolBytes({
            host: this.host,
            port: this.port,
            clientId: this.clientId
        });
        // Build rate limiter
        this.rateLimiter = new RateLimiter((data) => {
            return (this.protocolBytes as ProtocolBytes).sendFieldset(data);
        }, 45, 1000, this.timeoutMs);
        // attach messages handler
        this.incomeHandler = new IncomeFieldsetHandler(this.timeoutMs, this.emitter);
    }

    /**
     * Creates a connection promise
     */
    private async createConnection() {
        // allow gc to remove old data
        this.protocolBytes.removeAllListeners();

        this.protocolBytes.on('message_fieldset', (o) => {
            this.onMessageFieldset(o);
        });

        this.protocolBytes.on('close', () => {
            this.connected = false;
            this.emitter.emit('close');
        });

        this.protocolBytes.on('error', (e) => {
            this.emitter.emit('error', e);
        });

        await this.protocolBytes.connect();

        this.protocolBytes.sendHandshake();

        const serverVersion = await this.incomeHandler.awaitMessageType(IncomeMessageType._SERVER_VERSION) as number;
        this.serverVersion = serverVersion;
        this.incomeHandler.setServerVersion(serverVersion);

        this.connectSendStartAPI();
        const [nextValidId, accounts] = await Promise.all([
            this.incomeHandler.awaitMessageType(IncomeMessageType.NEXT_VALID_ID),
            this.incomeHandler.awaitMessageType(IncomeMessageType.MANAGED_ACCTS)
        ]);

        this.nextValidId = nextValidId as number;
    }

    /**
     * Connects to TWS/IB Gateway application
     * if the client is not already connected,
     * otherwise returns if there is already a connection
     */
    public async connect() {
        if (this.connected) { return; }

        if (!!this.connectionPromise) {
            this.connectionPromise = this.createConnection();
        }

        await this.connectionPromise;
        this.connected = true;
        this.connectionPromise = null;
    }

    private connectSendStartAPI() {
        const START_API = 71;
        const VERSION = 2;
        const optCapab = '';

        this.protocolBytes.sendFieldset(
            [START_API, VERSION, this.clientId, optCapab]);
    }

    private async sendFieldsetRateLimited(fields: any) {
        await this.connect();
        this.rateLimiter.run(fields);
    }

    private async sendFieldsetExpirable(fields: any[]) {
        await this.connect();
        this.rateLimiter.runExpirable(fields);
    }

    private onMessageFieldset(fields: any[]) {
        if (!this.serverVersion) {
            this.incomeHandler.processMessageFieldsetBeforeServerVersion(fields);
        } else {
            this.incomeHandler.processMessageFieldset(fields);
        }
    }

    async allocateRequestId() {
        await this.connect();
        return ++this.nextValidId;
    }

    /**
     * Asks the current system time on the server side.
     * @returns Promise<number>
     */
    async getCurrentTime() {

        await this.sendFieldsetExpirable([
            OutcomeMessageType.REQ_CURRENT_TIME,
            1 /* VERSION */
        ]);

        return await this.incomeHandler.awaitMessageType(IncomeMessageType.CURRENT_TIME);
    }
}