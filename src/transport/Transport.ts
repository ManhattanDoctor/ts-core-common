import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExtendedError } from '../error';
import { LoadableEvent } from '../Loadable';
import { ILogger, LoggerWrapper } from '../logger';
import { ObservableData } from '../observer';
import { PromiseHandler } from '../promise';
import { DateUtil, ObjectUtil } from '../util';
import { TransportTimeoutError } from './error';
import { ITransportSettings } from './ITransportSettings';
import { ITransport, ITransportCommand, ITransportCommandAsync, ITransportCommandOptions, ITransportEvent, TransportCommandWaitDelay } from './ITransport';
import { TransportLogCommandLogFilter, TransportLogEventFilter, TransportLogType, TransportLogUtil } from './TransportLogUtil';

export abstract class Transport<S extends ITransportSettings = ITransportSettings, O extends ITransportCommandOptions = ITransportCommandOptions, R extends ITransportCommandRequest = ITransportCommandRequest> extends LoggerWrapper implements ITransport {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static DEFAULT_TIMEOUT = 30 * DateUtil.MILLISECONDS_SECOND;
    public static DEFAULT_WAIT_DELAY = TransportCommandWaitDelay.NORMAL;
    public static DEFAULT_WAIT_MAX_COUNT = 3;

    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static setDefaultOptions(item: ITransportCommandOptions): void {
        if (_.isNil(item)) {
            return;
        }
        if (_.isNil(item.waitDelay)) {
            item.waitDelay = Transport.DEFAULT_WAIT_DELAY;
        }
        if (_.isNil(item.waitMaxCount)) {
            item.waitMaxCount = Transport.DEFAULT_WAIT_MAX_COUNT;
        }
        if (_.isNil(item.defaultTimeout)) {
            item.defaultTimeout = Transport.DEFAULT_TIMEOUT;
        }
    }
    
    public static clearDefaultOptions(item: ITransportCommandOptions): void {
        if (_.isNil(item)) {
            return;
        }
        if (item.defaultTimeout === Transport.DEFAULT_TIMEOUT) {
            delete item.defaultTimeout;
        }
        if (item.waitDelay === Transport.DEFAULT_WAIT_DELAY) {
            delete item.waitDelay;
        }
        if (item.waitMaxCount === Transport.DEFAULT_WAIT_MAX_COUNT) {
            delete item.waitMaxCount;
        }
    }

    public static isCommandAsync<U, V = any>(command: ITransportCommand<U>): command is ITransportCommandAsync<U, V> {
        return ObjectUtil.instanceOf(command, ['id', 'name', 'response']);
    }

    public static isCommandHasError<U>(command: ITransportCommand<U>): boolean {
        return Transport.isCommandAsync(command) && !_.isNil(command.error);
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected requests: Map<string, R>;
    protected promises: Map<string, ITransportCommandPromise<any, any, O>>;
    protected listeners: Map<string, Subject<any>>;
    protected dispatchers: Map<string, Subject<any>>;

    protected observer: Subject<ObservableData<LoadableEvent, ITransportCommand<any>>>;

    protected _settings: S;
    protected _logEventFilters: Array<TransportLogEventFilter>;
    protected _logCommandFilters: Array<TransportLogCommandLogFilter>;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, settings?: S, context?: string) {
        super(logger, context);

        this._settings = settings;
        this._logEventFilters = new Array();
        this._logCommandFilters = new Array();

        this.observer = new Subject();

        this.requests = new Map();
        this.promises = new Map();
        this.listeners = new Map();
        this.dispatchers = new Map();
    }

    // --------------------------------------------------------------------------
    //
    //  ITransportSender
    //
    // --------------------------------------------------------------------------

    public abstract send<U>(command: ITransportCommand<U>, options?: O): void;

    public abstract sendListen<U, V>(command: ITransportCommandAsync<U, V>, options?: O): Promise<V>;

    public getDispatcher<T>(name: string): Observable<T> {
        let subject = this.dispatchers.get(name);
        if (!_.isNil(subject)) {
            return subject.asObservable();
        }
        subject = new Subject<T>();
        this.dispatchers.set(name, subject);

        let item = subject.asObservable();
        item.pipe(takeUntil(this.destroyed)).subscribe(item => this.logEvent(item, TransportLogType.EVENT_RECEIVED));
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  ITransportReceiver
    //
    // --------------------------------------------------------------------------

    public abstract wait<U>(command: ITransportCommand<U>): void;

    public abstract complete<U, V>(command: ITransportCommand<U>, result?: V | Error): void;

    public abstract dispatch<T>(event: ITransportEvent<T>): void;

    public listen<U>(name: string): Observable<U> {
        if (this.listeners.has(name)) {
            throw new ExtendedError(`Command "${name}" already listening`);
        }
        let item = new Subject<U>();
        this.listeners.set(name, item);

        this.logListen(name);
        return item.asObservable();
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

        if (!_.isNil(this.requests)) {
            this.requests.clear();
            this.requests = null;
        }

        if (!_.isNil(this.listeners)) {
            this.listeners.forEach(item => item.complete());
            this.listeners.clear();
            this.listeners = null;
        }

        if (!_.isNil(this.dispatchers)) {
            this.dispatchers.forEach(item => item.complete());
            this.dispatchers.clear();
            this.dispatchers = null;
        }

        if (!_.isNil(this.observer)) {
            this.observer.complete();
            this.observer = null;
        }

        if (!_.isNil(this.promises)) {
            this.promises.clear();
            this.promises = null;
        }

        this._settings = null;
        this._logEventFilters = null;
        this._logCommandFilters = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Help Methods
    //
    // --------------------------------------------------------------------------

    protected commandProcessed<U, V>(command: ITransportCommandAsync<U, V>): void {
        let promise = this.promises.get(command.id);
        if (_.isNil(promise)) {
            return;
        }
        this.promises.delete(command.id);
        if (this.isCommandHasError(command)) {
            promise.handler.reject(command.error);
            this.observer.next(new ObservableData(LoadableEvent.ERROR, command, command.error));
        } else {
            promise.handler.resolve(command.data);
            this.observer.next(new ObservableData(LoadableEvent.COMPLETE, command));
        }
        this.observer.next(new ObservableData(LoadableEvent.FINISHED, command));
    }

    protected async commandTimeout<U, V>(command: ITransportCommandAsync<U, V>, options: O): Promise<void> {
        await PromiseHandler.delay(this.getCommandTimeoutDelay(command, options));
        if (_.isNil(this.promises) || !this.promises.has(command.id)) {
            return;
        }
        command.response(new TransportTimeoutError(command));
        this.logCommand(command, TransportLogType.RESPONSE_TIMEOUT);
        this.commandProcessed(command);
    }

    protected isCommandAsync<U, V = any>(command: ITransportCommand<U>): command is ITransportCommandAsync<U, V> {
        return Transport.isCommandAsync(command);
    }

    protected isCommandHasError<U>(command: ITransportCommand<U>): boolean {
        return Transport.isCommandHasError(command);
    }

    protected getCommandOptions<U>(command: ITransportCommand<U>, options?: O): O {
        if (_.isNil(options)) {
            options = {} as O;
        }
        if (_.isNil(options.defaultTimeout)) {
            options.defaultTimeout = this.getSettingsValue('defaultTimeout', Transport.DEFAULT_TIMEOUT);
        }
        return options;
    }

    protected addCommandPromise<U, V>(command: ITransportCommandAsync<U, V>, options: O): ITransportCommandPromise<U, V, O> {
        let item = { command, handler: PromiseHandler.create<V, ExtendedError>(), options };
        this.promises.set(command.id, item);
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Timeout Methods
    //
    // --------------------------------------------------------------------------

    protected getCommandTimeoutDelay<U>(command: ITransportCommand<U>, options: O): number {
        return !_.isNil(options) && _.isNil(options.defaultTimeout) ? options.defaultTimeout : Transport.DEFAULT_TIMEOUT;
    }

    protected isCommandRequestExpired(request: R): boolean {
        return !_.isNil(request.expiredDate) ? Date.now() > request.expiredDate.getTime() : false;
    }

    protected isCommandRequestWaitExpired(request: R): boolean {
        if (!_.isNil(request.waitMaxCount) && request.waitCount >= request.waitMaxCount) {
            return true;
        }
        if (request.waitCount * request.waitDelay >= request.defaultTimeout) {
            return true;
        }
        return false;
    }

    // --------------------------------------------------------------------------
    //
    //  Log Methods
    //
    // --------------------------------------------------------------------------

    protected logListen(name: string): void {
        this.debug(`Start listening "${name}" command`);
    }

    protected logEvent<T>(event: ITransportEvent<T>, type: TransportLogType): void {
        if (!_.isEmpty(this.logEventFilters) && !this.logEventFilters.every(filter => filter(event, type))) {
            return;
        }
        this.debug(TransportLogUtil.eventToString(event, type));
        this.logVerboseData(event.data, type);
    }

    protected logCommand<U>(command: ITransportCommand<U>, type: TransportLogType): void {
        if (!_.isEmpty(this.logCommandFilters) && !this.logCommandFilters.every(filter => filter(command, type))) {
            return;
        }
        this.debug(TransportLogUtil.commandToString(command, type));
        switch (type) {
            case TransportLogType.REQUEST_SENDED:
            case TransportLogType.REQUEST_RECEIVED:
            case TransportLogType.REQUEST_NO_REPLY:
                this.logRequest(command, type);
                break;

            case TransportLogType.RESPONSE_SENDED:
            case TransportLogType.RESPONSE_RECEIVED:
            case TransportLogType.RESPONSE_NO_REPLY:
                this.logResponse(command, type);
                break;
        }
    }

    protected logRequest<U>(command: ITransportCommand<U>, type: TransportLogType): void {
        if (!_.isNil(command)) {
            this.logVerboseData(command.request, type);
        }
    }

    protected logResponse<U>(command: ITransportCommand<U>, type: TransportLogType): void {
        if (!_.isNil(command) && this.isCommandAsync(command)) {
            this.logVerboseData(this.isCommandHasError(command) ? command.error : command.data, type);
        }
    }

    protected logVerboseData<U>(data: U, type: TransportLogType): void {
        if (!_.isNil(data)) {
            this.verbose(TransportLogUtil.verbose(data, type));
        }
    }


    // --------------------------------------------------------------------------
    //
    //  Protected Properties
    //
    // --------------------------------------------------------------------------

    protected getSettingsValue<P extends keyof S>(name: P, defaultValue?: S[P]): S[P] {
        let value = !_.isNil(this.settings) ? this.settings[name] : null;
        return !_.isNil(value) ? value : defaultValue;
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get settings(): S {
        return this._settings;
    }

    public get logEventFilters(): Array<TransportLogEventFilter> {
        return this._logEventFilters;
    }

    public get logCommandFilters(): Array<TransportLogCommandLogFilter> {
        return this._logCommandFilters;
    }

    public get events(): Observable<ObservableData<LoadableEvent, ITransportCommand<any>>> {
        return this.observer.asObservable();
    }
}

export interface ITransportCommandPromise<U = any, V = any, O extends ITransportCommandOptions = ITransportCommandOptions> {
    handler: PromiseHandler<V, ExtendedError>;
    command: ITransportCommandAsync<U, V>;
    options: O;
}

export interface ITransportCommandRequest extends ITransportCommandOptions {
    waitCount: number;
    expiredDate: Date;
    isNeedReply: boolean;
}