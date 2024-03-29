
import * as _ from 'lodash';
import { ITransportCommandPromise, ITransportCommandRequest, Transport } from './Transport';
import { ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent } from './ITransport';
import { ITransportSettings } from './ITransportSettings';
import { ExtendedError } from '../error';
import { TransportLogType } from './TransportLogUtil';
import { TraceUtil } from '../trace';
import { ObservableData } from '../observer';
import { LoadableEvent } from '../Loadable';

export abstract class TransportImpl<S extends ITransportSettings = ITransportSettings, O extends ITransportCommandOptions = ITransportCommandOptions, R extends ITransportCommandRequest = ITransportCommandRequest, E = void> extends Transport<S, O, R> {
    // --------------------------------------------------------------------------
    //
    //  ITransportSender
    //
    // --------------------------------------------------------------------------

    public send<U>(command: ITransportCommand<U>, options?: O): void {
        this.commandRequest(command, this.getCommandOptions(command, options), false);
    }

    public sendListen<U, V>(command: ITransportCommandAsync<U, V>, options?: O): Promise<V> {
        let promise = this.promises.get(command.id);
        if (!_.isNil(promise)) {
            return promise.handler.promise;
        }
        options = this.getCommandOptions(command, options);
        promise = this.addCommandPromise(command, options);
        this.commandRequest(command, options, true);
        return promise.handler.promise;
    }

    // --------------------------------------------------------------------------
    //
    //  ITransportSender
    //
    // --------------------------------------------------------------------------

    public wait<U>(command: ITransportCommand<U>): void {
        throw new ExtendedError(`Method doesn't implemented`);
    }

    public complete<U, V>(command: ITransportCommand<U>, response?: V | Error): void {
        let request = this.requests.get(command.id);
        if (_.isNil(request)) {
            return;
        }

        this.requests.delete(command.id);

        let isCommandNeedReply = this.checkCommandNeedReply(command, request);
        if (!isCommandNeedReply) {
            if (this.isCommandResponseError(response)) {
                this.logCommand(command, TransportLogType.RESPONSE_NO_REPLY_ERROR);
                this.logVerboseData(response, TransportLogType.RESPONSE_NO_REPLY_ERROR);
            }
            return;
        }

        let isCommandExpired = this.checkResponseCommandExpired(command, request);
        if (isCommandExpired || !this.isCommandAsync(command)) {
            return;
        }

        command.response(response);
        this.commandResponse(command, request);
    }

    public dispatch<T>(event: ITransportEvent<T>, options?: E): void {
        TraceUtil.addIfNeed(event);
        this.eventRequest(event, options);
    }

    // --------------------------------------------------------------------------
    //
    //  Request Methods
    //
    // --------------------------------------------------------------------------

    protected async commandRequest<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean): Promise<void> {
        this.commandRequestTimeout(command, options, isNeedReply);
        try {
            this.logCommand(command, isNeedReply ? TransportLogType.REQUEST_SENDED : TransportLogType.REQUEST_NO_REPLY);
            await this.commandRequestExecute(command, options, isNeedReply);
        }
        catch (error) {
            this.commandRequestErrorCatch(command, options, isNeedReply, error);
        }
    }

    protected commandRequestTimeout<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean): void {
        if (!this.isCommandAsync(command) || !isNeedReply) {
            return;
        }
        this.commandTimeout(command, options);
        this.observer.next(new ObservableData(LoadableEvent.STARTED, command));
    }

    protected commandRequestErrorCatch<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean, error: any): void {
        if (!this.isCommandAsync(command) || !isNeedReply) {
            return;
        }
        command.response(this.commandRequestErrorParse(error));
        this.logCommand(command, TransportLogType.RESPONSE_RECEIVED);
        this.commandProcessed(command);
    }

    protected commandRequestErrorParse(error: any): ExtendedError {
        return ExtendedError.instanceOf(error) || error instanceof Error ? ExtendedError.create(error) : new ExtendedError(`Unknown error`, ExtendedError.DEFAULT_ERROR_CODE, error);
    }

    protected commandRequestResponseReceived<U, V>(promise: ITransportCommandPromise<U, V>, result?: V | Error): void {
        let command = promise.command;
        command.response(result);
        if (this.isCommandHasError(command)) {
            command.error.stack = null;
        }
        this.logCommand(command, TransportLogType.RESPONSE_RECEIVED);
        this.commandProcessed(command);
    }

    protected abstract commandRequestExecute<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean): Promise<void>;

    // --------------------------------------------------------------------------
    //
    //  Response Methods
    //
    // --------------------------------------------------------------------------

    protected async commandResponse<U, V>(command: ITransportCommandAsync<U, V>, request: R): Promise<void> {
        try {
            this.logCommand(command, TransportLogType.RESPONSE_SENDED);
            await this.commandResponseExecute(command, request);
        }
        catch (error) {
            this.commandResponseErrorCatch(command, request, error);
        }
    }

    protected async commandResponseDispatch<U>(command: ITransportCommand<U>, options: O, isNeedReply: boolean): Promise<void> {
        let listener = this.listeners.get(command.name);
        if (_.isNil(listener)) {
            this.complete(command, new ExtendedError(`No listener for "${command.name}" command`));
        }
        else {
            listener.next(command);
        }
    }

    protected commandResponseErrorCatch<U>(command: ITransportCommand<U>, request: R, error: any): void {
        error = this.commandResponseErrorParse(error);
        this.warn(`Unable to send "${command}" command response: ${error.toString()}`);
    }

    protected commandResponseErrorParse(error: any): ExtendedError {
        return ExtendedError.instanceOf(error) || error instanceof Error ? ExtendedError.create(error) : new ExtendedError(`Unknown error`, ExtendedError.DEFAULT_ERROR_CODE, error);
    }

    protected abstract commandResponseExecute<U>(command: ITransportCommand<U>, request: R): Promise<void>;

    protected checkCommandNeedReply<U, V>(command: ITransportCommand<U>, request: R): boolean {
        if (request.isNeedReply) {
            return true;
        }
        this.logCommand(command, TransportLogType.RESPONSE_NO_REPLY);
        return false;
    }

    protected checkRequestCommandExpired<U>(command: ITransportCommand<U>, request: R): boolean {
        if (!this.isCommandRequestExpired(request)) {
            return false;
        }
        this.logCommand(command, TransportLogType.REQUEST_EXPIRED);
        return true;
    }

    protected checkResponseCommandExpired<U>(command: ITransportCommand<U>, request: R): boolean {
        if (!this.isCommandRequestExpired(request)) {
            return false;
        }
        this.logCommand(command, TransportLogType.RESPONSE_EXPIRED);
        return true;
    }

    protected isCommandResponseError<V>(result: V | Error): boolean {
        return ExtendedError.instanceOf(result) || result instanceof Error;
    }

    // --------------------------------------------------------------------------
    //
    //  Event Methods
    //
    // --------------------------------------------------------------------------

    protected async eventRequest<U>(event: ITransportEvent<U>, options?: E): Promise<void> {
        try {
            this.logEvent(event, TransportLogType.EVENT_SENDED);
            await this.eventRequestExecute(event, options);
        }
        catch (error) {
            this.eventRequestErrorCatch(event, options, error);
        }
    }

    protected eventRequestErrorCatch<U>(event: ITransportEvent<U>, options: E, error: any): void {
        error = this.commandResponseErrorParse(error);
        this.warn(`Unable to send "${event}" command response: ${error.toString()}`);
    }

    protected eventRequestErrorParse(error: any): ExtendedError {
        return ExtendedError.instanceOf(error) || error instanceof Error ? ExtendedError.create(error) : new ExtendedError(`Unknown error`, ExtendedError.DEFAULT_ERROR_CODE, error);
    }

    protected abstract eventRequestExecute<U>(event: ITransportEvent<U>, options?: E): Promise<void>;
}
