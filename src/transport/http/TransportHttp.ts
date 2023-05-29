import axios from 'axios';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { LoadableEvent } from '../../Loadable';
import { ExtendedError } from '../../error/ExtendedError';
import { ObservableData } from '../../observer/ObservableData';
import { Transport } from '../../transport/Transport';
import { ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent } from '../../transport/ITransport';
import { ITransportHttpRequest } from './ITransportHttpRequest';
import { ITransportHttpSettings } from './ITransportHttpSettings';
import { TransportHttpCommandAsync } from './TransportHttpCommandAsync';
import { isAxiosError, parseAxiosError } from '../../error/Axios';
import { TransportLogType } from '../TransportLogUtil';

export class TransportHttp<S extends ITransportHttpSettings = ITransportHttpSettings, O extends ITransportCommandOptions = ITransportCommandOptions> extends Transport<S, O> {
    // --------------------------------------------------------------------------
    //
    // 	Static Methods
    //
    // --------------------------------------------------------------------------

    public static isError(item: any): boolean {
        return ExtendedError.instanceOf(item) || isAxiosError(item);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public send<U>(command: ITransportCommand<U>, options?: O): void {
        this.requestSend(command, this.getCommandOptions(command, options));
    }

    public sendListen<U, V>(command: ITransportCommandAsync<U, V>, options?: O): Promise<V> {
        let promise = this.promises.get(command.id);
        if (!_.isNil(promise)) {
            return promise.handler.promise;
        }
        options = this.getCommandOptions(command, options);
        promise = this.addCommandPromise(command, options);
        this.requestSend(command, options);
        return promise.handler.promise;
    }

    public complete<U, V>(command: ITransportCommand<U>, result?: V | Error): void {
        if (this.isCommandAsync(command)) {
            command.response(result);
        }
        this.responseSend(command);
    }

    public call<V = any, U = any>(path: string, request?: ITransportHttpRequest<U>, options?: O): Promise<V> {
        return this.sendListen(new TransportHttpCommandAsync(path, request), options);
    }

    public wait<U>(command: ITransportCommand<U>): void {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    public listen<U>(name: string): Observable<U> {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    public dispatch<T>(event: ITransportEvent<T>): void {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    public getDispatcher<T>(name: string): Observable<T> {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    // --------------------------------------------------------------------------
    //
    //  Help Methods
    //
    // --------------------------------------------------------------------------

    protected isError(data: any): boolean {
        return TransportHttp.isError(data);
    }

    protected parseError<U>(data: any, command: ITransportCommand<U>): ExtendedError {
        if (isAxiosError(data)) {
            return parseAxiosError(data);
        }
        if (ExtendedError.instanceOf(data) || data instanceof Error) {
            return ExtendedError.create(data);
        }
        return new ExtendedError(`Unknown error`, ExtendedError.DEFAULT_ERROR_CODE, data);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async requestSend<U>(command: ITransportCommand<U>, options: O): Promise<void> {
        this.prepareCommand(command, options);

        this.logCommand(command, this.isCommandAsync(command) ? TransportLogType.REQUEST_SENDED : TransportLogType.REQUEST_NO_REPLY);
        this.observer.next(new ObservableData(LoadableEvent.STARTED, command));
        let result = null;

        try {
            let { data } = await axios.create(this.settings).request(command.request);
            result = data;
        } catch (error) {
            result = error;
        }
        this.complete(command, this.isError(result) ? this.parseError(result, command) : result);
    }

    protected responseSend<U>(command: ITransportCommand<U>): void {
        if (!this.isCommandAsync(command)) {
            this.logCommand(command, TransportLogType.RESPONSE_NO_REPLY);
            this.observer.next(new ObservableData(LoadableEvent.FINISHED, command));
            return;
        }
        // Immediately receive the command
        this.responseReceived(command);
    }

    protected responseReceived<U, V>(command: ITransportCommandAsync<U, V>): void {
        this.logCommand(command, TransportLogType.RESPONSE_RECEIVED);
        this.commandProcessed(command);
    }

    protected prepareCommand<U>(command: ITransportCommand<U>, options: O): void {
        if (_.isNil(this.settings)) {
            throw new ExtendedError(`Settings is undefined`);
        }
        if (_.isNil(this.settings.method)) {
            throw new ExtendedError(`Defaults method is undefined`);
        }

        let request = command.request as ITransportHttpRequest;
        request.timeout = options.timeout;

        if (_.isNil(request.url)) {
            request.url = command.name;
        }
        if (_.isNil(request.method)) {
            request.method = this.settings.method;
        }
        if (_.isNil(request.isHandleError) && this.settings.isHandleError) {
            request.isHandleError = this.settings.isHandleError;
        }
        if (_.isNil(request.isHandleLoading) && this.settings.isHandleLoading) {
            request.isHandleLoading = this.settings.isHandleLoading;
        }

        if (request.method.toLowerCase() === 'get') {
            request.params = request.data;
            delete request.data;
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get headers(): any {
        return !_.isNil(this.settings) ? this.settings.headers : null;
    }

    public get url(): string {
        return !_.isNil(this.settings) ? this.settings.baseURL : null;
    }
    public set url(value: string) {
        if (!_.isNil(this.settings)) {
            this.settings.baseURL = value;
        }
    }
}

export interface ITransportHttpCommand<T> extends ITransportCommand<ITransportHttpRequest<T>> { }
export interface ITransportHttpCommandAsync<U, V> extends ITransportCommandAsync<ITransportHttpRequest<U>, V> { }
