import { EventEmitter } from 'events';
import { Socket } from 'net';
import { format } from 'util';

export interface ConnectionParameters {
    host?: string;
    port: number;
    clientId: number;
}

/**
 * Protocol's byte-level handing
 */
export class ProtocolBytes {

    private emitter: EventEmitter;
    private host: string;
    private port: number;
    private clientId: number;
    private socket: Socket;
    private dataPending: Buffer | null;

    constructor(p: ConnectionParameters) {
        this.emitter = new EventEmitter();
        this.host = p.host || '127.0.0.1';
        this.port = p.port;
        this.clientId = p.clientId;
        this.socket = new Socket();
        this.dataPending = null;
    }

    public connect() {

        this.socket.on('data', (data) => { this.onData(data); });

        this.socket.on('close', () => { this.emitter.emit('close'); });

        this.socket.on('end', () => { this.emitter.emit('close'); });

        this.socket.on('error', (e) => { this.emitter.emit('error', e); });

        return this.promiseBoundToSocketError((resolve) => {
            this.socket.connect({
                host: this.host,
                port: this.port
            }, resolve);
        });
    }

    on(event: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.on(event, listener);
        return this;
    }

    off(event: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.off(event, listener);
        return this;
    }

    removeAllListeners() {
        this.emitter.removeAllListeners();
        return this;
    }

    disconnect() {
        this.socket.end();
        return this;
    }

    sendFieldset(fields: Record<string, any>) {
        const fieldsStrings = fields.map((i: any) => {
            if (i == null) {
                return '';
            } else if (typeof i === 'boolean') {
                return i ? '1' : '0';
            } else if (typeof i === 'string') {
                return i;
            } else if (typeof i === 'number') {
                return i.toString();
            } else {
                let output = '';
                for (const key of Object.keys(i)) {
                    output += key + '=' + i[key] + ';';
                }
                return output;
            }
        });

        const str = fieldsStrings.join('\0') + '\0';
        const message = this.serializeString(str);

        this.socket.write(message);
    }

    sendHandshake() {
        const MIN_CLIENT_VERSION = 100;
        const MAX_CLIENT_VERSION = 151;

        const v100prefix = 'API\0';
        this.socket.write(v100prefix);

        const v100version = format('v%d..%d', MIN_CLIENT_VERSION, MAX_CLIENT_VERSION);
        const msg = this.serializeString(v100version);
        this.socket.write(msg);
    }



    private async promiseBoundToSocketError(workload: (resolve: ()=>void)=>void) {
        const onError = (err: Error) => { throw err; };

        const onSuccess = () => {
            this.socket.off('error', onError);
            return;
        };

        this.socket.once('error', onError);
        workload(onSuccess);
    }

    private serializeString(str: string) {
        const content = Buffer.from(str);
        const header = Buffer.alloc(4);
        header.writeInt32BE(content.length);
        return Buffer.concat([header, content]);
    }

    private onData(data: Buffer) {

        if (this.dataPending) {
            this.dataPending = Buffer.concat([this.dataPending, data]);
        } else {
            this.dataPending = data;
        }

        while (this.dataPending && this.dataPending.length >= 4) {
            const stringLength = this.dataPending.readInt32BE(0);
            if (this.dataPending.length < stringLength + 4) {
                return;
            }

            const messageString = this.dataPending.toString('ascii', 4, stringLength + 4);
            if (this.dataPending.length === stringLength + 4) {
                this.dataPending = null;
            } else {
                this.dataPending = this.dataPending.slice(stringLength + 4);
            }

            const messageFields = messageString.split('\0');
            // last item is always empty
            messageFields.pop();

            this.emitter.emit('message_fieldset', messageFields);
        }
    }
}