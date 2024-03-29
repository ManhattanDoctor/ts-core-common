import { Observable } from 'rxjs';
import { ExtendedError } from '../error';
import { ITraceable } from '../trace';

export interface ITransport extends ITransportSender, ITransportReceiver { }

export interface ITransportSender {
    send<U>(command: ITransportCommand<U>, options?: ITransportCommandOptions): void;
    sendListen<U, V>(command: ITransportCommandAsync<U, V>, options?: ITransportCommandOptions): Promise<V>;
    getDispatcher<T>(name: string): Observable<T>;
}

export interface ITransportReceiver {
    wait<U>(command: ITransportCommand<U>): void;
    listen<U>(name: string): Observable<U>;
    complete<U, V>(command: ITransportCommand<U>, response?: V | ExtendedError): void;
    dispatch<T>(event: ITransportEvent<T>, ...params): void;
}

export interface ITransportCommand<U> {
    readonly id: string;
    readonly name: string;
    readonly request?: U;
}

export interface ITransportCommandAsync<U, V> extends ITransportCommand<U> {
    readonly data: V;
    readonly error?: ExtendedError;
    response(value: V | ExtendedError | Error): void;
}

export interface ITransportCommandOptions {
    timeout?: number;
    waitMax?: number;
    waitDelay?: TransportCommandWaitDelay;
}

export enum TransportCommandWaitDelay {
    EXTRA_SLOW = 30000,
    SUPER_SLOW = 10000,
    SLOW = 5000,
    NORMAL = 3000,
    FAST = 1000,
    SUPER_FAST = 500,
    EXTRA_FAST = 100
}

export interface ITransportEvent<T> extends ITraceable {
    readonly uid: string;
    readonly name: string;
    readonly data?: T;
}
