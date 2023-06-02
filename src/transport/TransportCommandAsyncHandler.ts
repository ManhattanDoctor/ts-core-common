import { ITransportCommandAsync } from './ITransport';
import { TransportCommandHandler } from './TransportCommandHandler';

/**
 * @deprecated Use TransportCommandHandler instead
 */
export abstract class TransportCommandAsyncHandler<U, V, T extends ITransportCommandAsync<U, V>> extends TransportCommandHandler<U, T, V> { }