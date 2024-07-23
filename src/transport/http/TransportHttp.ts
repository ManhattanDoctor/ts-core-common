import axios from 'axios';
import * as _ from 'lodash';
import { ITransportHttpSettings } from './ITransportHttpSettings';
import { ExtendedError, isAxiosError, parseAxiosError } from '../../error';
import { ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent } from '../ITransport';
import { ITransportHttpRequest } from './ITransportHttpRequest';
import { TransportImpl } from '../TransportImpl';
import { TransportHttpCommandAsync } from './TransportHttpCommandAsync';
import { TransportLogType } from '../TransportLogUtil';
import { ITransportCommandRequest } from '../Transport';

export class TransportHttp<S extends ITransportHttpSettings = ITransportHttpSettings, O extends ITransportCommandOptions = ITransportCommandOptions> extends TransportImpl<S, O> {
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

    public call<V = any, U = any>(path: string, request?: ITransportHttpRequest<U>, options?: O): Promise<V> {
        return this.sendListen(new TransportHttpCommandAsync(path, request), options);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async commandRequestExecute<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean): Promise<void> {
        this.prepareCommand(command, options);

        this.requests.set(command.id, { waited: 0, isNeedReply });

        let { data } = await axios.create(this.settings).request(command.request);
        if (this.isError(data)) {
            this.commandRequestErrorCatch(command, options, isNeedReply, data);
        }
        else {
            this.logCommand(command, TransportLogType.REQUEST_RECEIVED);
            this.complete(command, data);
        }
    }

    protected async commandResponseExecute<U, V>(command: ITransportCommandAsync<U, V>, request: ITransportCommandRequest): Promise<void> {
        let promise = this.promises.get(command.id);
        if (_.isNil(promise)) {
            this.warn(`Unable to find command promise: probably command was already completed`);
            return;
        }
        this.commandRequestResponseReceived(promise, _.isNil(command.error) ? command.data : command.error);
    }

    protected eventRequestExecute<U>(event: ITransportEvent<U>): Promise<void> {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    protected prepareCommand<U>(command: ITransportCommand<U>, options: O): void {
        if (_.isNil(this.settings)) {
            throw new ExtendedError(`Settings is undefined`);
        }
        if (_.isNil(this.settings.method)) {
            throw new ExtendedError(`Default method is undefined`);
        }

        let request = command.request as ITransportHttpRequest;
        if (_.isNil(request.url)) {
            request.url = command.name;
        }
        if (_.isNil(request.method)) {
            request.method = this.settings.method;
        }
        if (_.isNil(request.timeout)) {
            request.timeout = options.timeout;
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

    protected isError(data: any): boolean {
        return TransportHttp.isError(data);
    }

    protected parseError<U, V>(error: any): ExtendedError<U, V> {
        return isAxiosError(error) ? parseAxiosError(error) : super.parseError(error);
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
