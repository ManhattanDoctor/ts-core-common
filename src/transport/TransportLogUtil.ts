import { UnreachableStatementError } from "../error";
import * as util from 'util';
import * as _ from 'lodash';
import { ITransportCommand, ITransportEvent } from "./ITransport";
import { Transport } from "./Transport";

export class TransportLogUtil {
    // --------------------------------------------------------------------------
    //
    //  Public Static Methods
    //
    // --------------------------------------------------------------------------

    public static getLogMark(type: TransportLogType): string {
        switch (type) {
            case TransportLogType.REQUEST_SENDED:
                return '→';
            case TransportLogType.REQUEST_RECEIVED:
                return '⇠';
            case TransportLogType.REQUEST_NO_REPLY:
                return '⇥';
            case TransportLogType.REQUEST_EXPIRED:
                return '↚';

            case TransportLogType.RESPONSE_RECEIVED:
                return '←';
            case TransportLogType.RESPONSE_SENDED:
                return '⇢';
            case TransportLogType.RESPONSE_NO_REPLY:
                return '✔';
            case TransportLogType.RESPONSE_NO_REPLY_ERROR:
                return '✘';
            case TransportLogType.RESPONSE_EXPIRED:
                return '↛';
            case TransportLogType.RESPONSE_WAIT:
                return '↺';
            case TransportLogType.RESPONSE_TIMEOUT:
                return '⧖';

            case TransportLogType.EVENT_SENDED:
                return '↣';
            case TransportLogType.EVENT_RECEIVED:
                return '↢';
            case TransportLogType.EVENT_RECEIVED_NO_LISTENER:
                return '↤';

            default:
                throw new UnreachableStatementError(type);
        }
    }

    public static eventToString<U>(event: ITransportEvent<U>, type: TransportLogType): string {
        return `${TransportLogUtil.getLogMark(type)} ${event.name}`;
    }

    public static commandToString<U, V>(command: ITransportCommand<U>, type: TransportLogType): string {
        let suffix = '•';
        if (Transport.isCommandAsync(command) && (!_.isNil(command.error) || !_.isNil(command.data))) {
            suffix = Transport.isCommandHasError(command) ? '✘' : '✔';
        }
        return `${TransportLogUtil.getLogMark(type)} ${command.name} ${suffix} (${command.id})`;
    }

    public static verbose<U>(data: U, type: TransportLogType): string {
        return !_.isNil(data) ? `${TransportLogUtil.getLogMark(type)} ${util.inspect(data, { colors: true, showHidden: false, depth: null, compact: false })}` : null;
    }
}

export enum TransportLogType {
    REQUEST_RECEIVED = 'REQUEST_RECEIVED',
    REQUEST_SENDED = 'REQUEST_SENDED',
    REQUEST_NO_REPLY = 'REQUEST_NO_REPLY',
    REQUEST_EXPIRED = 'REQUEST_EXPIRED',

    RESPONSE_RECEIVED = 'RESPONSE_RECEIVE',
    RESPONSE_SENDED = 'RESPONSE_SENDED',
    RESPONSE_NO_REPLY = 'RESPONSE_NO_REPLY',
    RESPONSE_EXPIRED = 'RESPONSE_EXPIRED',
    RESPONSE_NO_REPLY_ERROR = 'REQUEST_NO_REPLY_ERROR',

    RESPONSE_WAIT = 'RESPONSE_WAIT',
    RESPONSE_TIMEOUT = 'RESPONSE_TIMEOUT',

    EVENT_SENDED = 'EVENT_SENDED',
    EVENT_RECEIVED = 'EVENT_RECEIVED',
    EVENT_RECEIVED_NO_LISTENER = 'EVENT_RECEIVED_NO_LISTENER'
}


export type TransportLogEventFilter = <U = any>(event: ITransportEvent<U>, type: TransportLogType) => boolean;

export type TransportLogCommandLogFilter = <U = any>(command: ITransportCommand<U>, type: TransportLogType) => boolean;

