import { Observable, Subject } from 'rxjs';
import { IDestroyable } from './IDestroyable';

export class Destroyable implements IDestroyable {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    private _destroyed: Subject<void>;
    private _isDestroyed: boolean;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor() {
        this._destroyed = new Subject();
        this._isDestroyed = false;
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

        this._isDestroyed = true;

        this._destroyed.next();
        this._destroyed.complete();
    }

    public ngOnDestroy(): void {
        this.destroy();
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get destroyed(): Observable<void> {
        return this._destroyed.asObservable();
    }

    public get isDestroyed(): boolean {
        return this._isDestroyed;
    }
}
