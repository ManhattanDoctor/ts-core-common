import * as _ from 'lodash';
import { ExtendedError } from '../../error';
import { LoadableEvent } from '../../Loadable';
import { ObservableData } from '../../observer';
import { PromiseHandler } from '../../promise';
import { DateUtil, ObjectUtil } from '../../util';
import { ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent } from '../ITransport';
import { ITransportCommandRequest, Transport } from '../Transport';
import { ITransportSettings } from '../ITransportSettings';
import { TraceUtil } from '../../trace';
import { TransportLogType } from '../TransportLogUtil';
import { TransportWaitExceedError } from '../error';

export class TransportLocal extends Transport<ITransportSettings> {
    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public send<U>(command: ITransportCommand<U>, options?: ITransportCommandOptions): void {
        this.requestSend(command, this.getCommandOptions(command, options), false);
    }

    public sendListen<U, V>(command: ITransportCommandAsync<U, V>, options?: ITransportCommandOptions): Promise<V> {
        if (this.promises.has(command.id)) {
            return this.promises.get(command.id).handler.promise;
        }

        options = this.getCommandOptions(command, options);

        let handler = PromiseHandler.create<V, ExtendedError>();
        this.promises.set(command.id, { command, handler, options });
        this.requestSend(command, options, true);
        return handler.promise;
    }

    public wait<U>(command: ITransportCommand<U>): void {
        let request = this.requests.get(command.id);
        if (_.isNil(request)) {
            throw new ExtendedError(`Unable to wait "${command.name}" command: can't find request details`);
        }

        if (this.isCommandRequestWaitExpired(request)) {
            this.complete(command, new TransportWaitExceedError(command));
            return;
        }

        this.waitSend(command, request);
    }

    public complete<U, V>(command: ITransportCommand<U>, response?: V | Error): void {
        let request = this.requests.get(command.id);
        this.requests.delete(command.id);

        if (_.isNil(request)) {
            this.error(`Unable to complete command "${command.name}", probably command was already completed`);
            return;
        }

        if (!this.isCommandAsync(command) || !request.isNeedReply) {
            this.logCommand(command, TransportLogType.RESPONSE_NO_REPLY);
            return;
        }

        if (this.isCommandRequestExpired(request)) {
            this.logCommand(command, TransportLogType.RESPONSE_EXPIRED);
            this.warn(`Unable to completed "${command.name}" command: timeout is expired`);
            return;
        }

        command.response(response);
        this.responseSend(command);
    }

    public dispatch<T>(event: ITransportEvent<T>): void {
        let item = this.dispatchers.get(event.name);
        if (_.isNil(item)) {
            return;
        }
        TraceUtil.addIfNeed(event);
        this.logEvent(event, TransportLogType.EVENT_SENDED);
        item.next(event);
    }

    // --------------------------------------------------------------------------
    //
    //  Private Methods
    //
    // --------------------------------------------------------------------------

    protected checkRequestStorage<U>(command: ITransportCommand<U>, options: ITransportCommandOptions, isNeedReply: boolean): ITransportCommandRequest {
        let item = this.requests.get(command.id);
        if (!_.isNil(item)) {
            item.waited++;
            return item;
        }
        item = { waited: 0, isNeedReply };
        item = ObjectUtil.copyProperties(options, item);
        if (isNeedReply) {
            item.expired = DateUtil.getDate(Date.now() + this.getCommandTimeoutDelay(command, options));
        }
        this.requests.set(command.id, item);
        return item;
    }

    protected async dispatchCommand<U>(command: ITransportCommand<U>, options: ITransportCommandOptions, isNeedReply: boolean): Promise<void> {
        let listener = this.listeners.get(command.name);
        if (_.isNil(listener)) {
            this.complete(command, new ExtendedError(`No listener for "${command.name}" command`));
            return;
        }
        listener.next(command);
    }

    // --------------------------------------------------------------------------
    //
    //  Private Methods
    //
    // --------------------------------------------------------------------------

    protected async requestSend<U>(command: ITransportCommand<U>, options: ITransportCommandOptions, isNeedReply: boolean): Promise<void> {
        this.logCommand(command, isNeedReply ? TransportLogType.REQUEST_SENDED : TransportLogType.REQUEST_NO_REPLY);
        this.observer.next(new ObservableData(LoadableEvent.STARTED, command));

        if (this.isCommandAsync(command)) {
            this.commandTimeout(command, options);
        }
        // Immediately receive the same command
        this.requestReceived(command, options, isNeedReply);
    }

    protected requestReceived<U>(command: ITransportCommand<U>, options: ITransportCommandOptions, isNeedReply: boolean): void {
        this.logCommand(command, TransportLogType.REQUEST_RECEIVED);
        let request = this.checkRequestStorage(command, options, isNeedReply);

        if (this.isCommandRequestExpired(request)) {
            this.logCommand(command, TransportLogType.REQUEST_EXPIRED);
            this.warn(`Received "${command.name}" command with already expired timeout: ignore`);
            this.requests.delete(command.id);
            return;
        }
        this.dispatchCommand(command, options, isNeedReply);
    }

    protected responseSend<U, V>(command: ITransportCommandAsync<U, V>): void {
        this.logCommand(command, TransportLogType.RESPONSE_SENDED);

        // Immediately receive the same command
        this.responseReceived(command);
    }

    protected responseReceived<U, V>(command: ITransportCommandAsync<U, V>): void {
        this.logCommand(command, TransportLogType.RESPONSE_RECEIVED);
        this.commandProcessed(command);
    }

    protected async waitSend<U>(command: ITransportCommand<U>, request: ITransportCommandRequest): Promise<void> {
        this.logCommand(command, TransportLogType.RESPONSE_WAIT);
        await PromiseHandler.delay(request.waitDelay);
        this.requestReceived(command, request, request.isNeedReply);
    }
}
