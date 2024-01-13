import { Observable, Subject, Subscription, filter, map } from 'rxjs';
import { ExtendedError } from '../../error/ExtendedError';
import { LoadableEvent } from '../../Loadable';
import { ObservableData } from '../../observer/ObservableData';
import { DestroyableMapCollection } from '../DestroyableMapCollection';
import * as _ from 'lodash';

export abstract class DataSourceMapCollection<U, V = any> extends DestroyableMapCollection<U> {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _isDirty: boolean = false;
    protected _isLoading: boolean = false;
    protected _isAllLoaded: boolean = false;

    protected reloadTimer: any;
    protected reloadHandler: () => void;
    protected isReloadRequest: boolean = false;

    protected observer: Subject<ObservableData<LoadableEvent | DataSourceMapCollectionEvent, number | V | U | Array<U>>>;
    protected subscription: Subscription;

    // --------------------------------------------------------------------------
    //
    //	Constructor
    //
    // --------------------------------------------------------------------------

    constructor(uidPropertyName: keyof U) {
        super(uidPropertyName);
        this.initialize();
    }

    // --------------------------------------------------------------------------
    //
    //	Protected Methods
    //
    // --------------------------------------------------------------------------

    protected initialize(): void {
        this.observer = new Subject();
        this.reloadHandler = this.reload.bind(this);
    }

    protected parseResponse(response: V): void {
        let items = this.getResponseItems(response);
        this.parseItems(items);
        this.checkIsAllLoaded(response, items);
    }

    protected parseItems(items: Array<any>): void {
        let parsed = _.compact(items.map(item => this.parseItem(item)));
        this.addItems(parsed);
        this.observer.next(new ObservableData(DataSourceMapCollectionEvent.DATA_LOADED_AND_PARSED, parsed));
    }

    protected parseError(error: ExtendedError): void { }

    protected getResponseItems(response: V): Array<any> {
        return _.isArray(response) ? response : [];
    }

    protected checkIsAllLoaded(response: V, items: Array<any>): void {
        this._isAllLoaded = true;
    }

    protected isAbleToLoad(): boolean {
        return !this.isLoading && !this.isAllLoaded;
    }

    protected isNeedClearAfterLoad(response: V): boolean {
        return this.isReloadRequest;
    }

    protected setLength(value: number): void {
        if (value === this._length) {
            return;
        }
        super.setLength(value);
        this.observer.next(new ObservableData(DataSourceMapCollectionEvent.MAP_LENGTH_CHANGED, value));
    }

    // --------------------------------------------------------------------------
    //
    //	Protected Abstract Methods
    //
    // --------------------------------------------------------------------------

    protected abstract request(): Promise<V>;

    protected abstract parseItem(item: any): U;

    // --------------------------------------------------------------------------
    //
    //	Public Methods
    //
    // --------------------------------------------------------------------------

    public async reload(): Promise<void> {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
        this._isDirty = true;
        this._isAllLoaded = false;
        this.isReloadRequest = true;
        return this.load();
    }

    public reloadDefer(delay: number = 500): void {
        clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(this.reloadHandler, delay);
    }

    public async load(): Promise<void> {
        if (!this.isAbleToLoad()) {
            return;
        }

        this._isDirty = true;
        this._isLoading = true;
        this.observer.next(new ObservableData(LoadableEvent.STARTED));

        try {
            let response = await this.request();
            if (this.isNeedClearAfterLoad(response)) {
                this.clear();
            }
            this.parseResponse(response);
            this.isReloadRequest = false;
            this.observer.next(new ObservableData(LoadableEvent.COMPLETE, response));
        } catch (error) {
            error = ExtendedError.create(error);
            this.parseError(error);
            this.observer.next(new ObservableData(LoadableEvent.ERROR, null, error));
        }

        this._isLoading = false;
        this.observer.next(new ObservableData(LoadableEvent.FINISHED));
    }

    public update(uid: string, data: Partial<U>): U {
        let item = super.update(uid, data);
        if (!_.isNil(item)) {
            this.observer.next(new ObservableData(DataSourceMapCollectionEvent.ITEM_CHANGED, item));
        }
        return item;
    }

    public replace(item: U): U {
        let existItem = super.replace(item);
        if (!_.isNil(item)) {
            this.observer.next(new ObservableData(DataSourceMapCollectionEvent.ITEM_REPLACED, existItem));
        }
        return existItem;
    }

    public reset(): void {
        this._isDirty = false;
        this._isLoading = false;
        this._isAllLoaded = false;
        this.isReloadRequest = false;

        clearTimeout(this.reloadTimer);
        this.reloadTimer = null;

        this.clear();
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

        this.observer.complete();
        this.observer = null;

        this.reloadHandler = null;
    }

    // --------------------------------------------------------------------------
    //
    //	Event Properties
    //
    // --------------------------------------------------------------------------

    public get events(): Observable<ObservableData<LoadableEvent | DataSourceMapCollectionEvent, V | number | U | Array<U>>> {
        return this.observer.asObservable();
    }

    public get started(): Observable<void> {
        return this.events.pipe(
            filter(item => item.type === LoadableEvent.STARTED),
            map(() => null)
        );
    }

    public get completed(): Observable<V> {
        return this.events.pipe(
            filter(item => item.type === LoadableEvent.COMPLETE),
            map(item => item.data as V)
        );
    }

    public get errored(): Observable<ExtendedError> {
        return this.events.pipe(
            filter(item => item.type === LoadableEvent.ERROR),
            map(item => item.error)
        );
    }

    public get finished(): Observable<void> {
        return this.events.pipe(
            filter(item => item.type === LoadableEvent.FINISHED),
            map(() => null)
        );
    }

    public get itemChanged(): Observable<U> {
        return this.events.pipe(
            filter(item => item.type === DataSourceMapCollectionEvent.ITEM_CHANGED),
            map(item => item.data as U)
        );
    }

    public get itemReplaced(): Observable<U> {
        return this.events.pipe(
            filter(item => item.type === DataSourceMapCollectionEvent.ITEM_REPLACED),
            map(item => item.data as U)
        );
    }

    public get mapLengthChanged(): Observable<number> {
        return this.events.pipe(
            filter(item => item.type === DataSourceMapCollectionEvent.MAP_LENGTH_CHANGED),
            map(item => Number(item.data))
        );
    }

    public get dataLoadedAndParsed(): Observable<Array<U>> {
        return this.events.pipe(
            filter(item => item.type === DataSourceMapCollectionEvent.DATA_LOADED_AND_PARSED),
            map(item => item.data as Array<U>)
        );
    }

    // --------------------------------------------------------------------------
    //
    //	Public Properties
    //
    // --------------------------------------------------------------------------

    public get isLoading(): boolean {
        return this._isLoading;
    }

    public get isDirty(): boolean {
        return this._isDirty;
    }

    public get isClear(): boolean {
        return !this.isDirty;
    }

    public get isAllLoaded(): boolean {
        return this._isAllLoaded;
    }
}

export enum DataSourceMapCollectionEvent {
    ITEM_CHANGED = 'ITEM_CHANGED',
    ITEM_REPLACED = 'ITEM_REPLACED',
    MAP_LENGTH_CHANGED = 'MAP_LENGTH_CHANGED',
    DATA_LOADED_AND_PARSED = 'DATA_LOADED_AND_PARSED'
}
