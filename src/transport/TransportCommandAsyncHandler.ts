import { ITransportCommandAsync } from './ITransport';
import { TransportCommandHandler } from './TransportCommandHandler';

export abstract class TransportCommandAsyncHandler<U, V, T extends ITransportCommandAsync<U, V>> extends TransportCommandHandler<U, T, V> {
    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected abstract execute(params: U): Promise<V>;
}
