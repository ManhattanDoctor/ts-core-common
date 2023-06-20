
import { filter, takeUntil } from 'rxjs';
import { ITransport, ITransportEvent } from './ITransport';
import { ILogger, LoggerWrapper } from '../logger';
import * as _ from 'lodash';

export abstract class TransportEventHandler<U, V extends ITransportEvent<U>, T extends ITransport = ITransport> extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected transport: T;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    protected constructor(logger: ILogger, transport: T, name: string) {
        super(logger);

        this.transport = transport;
        this.transport.getDispatcher<V>(name)
            .pipe(
                filter(item => this.filter(item)),
                takeUntil(this.destroyed))
            .subscribe(item => this.handleEvent(item));
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async handleEvent(item: V): Promise<void> {
        await this.execute(item.data, item);
    }

    protected filter(item: V): boolean {
        return true;
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
        this.transport = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Abstract Methods
    //
    // --------------------------------------------------------------------------

    protected abstract execute(data: U, ...params): Promise<void>;
}
