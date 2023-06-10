import { ITransport, ITransportCommandAsync } from './ITransport';
import { TransportCommandHandler } from './TransportCommandHandler';

export abstract class TransportCommandAsyncHandler<U, V, C extends ITransportCommandAsync<U, V>, T extends ITransport = ITransport> extends TransportCommandHandler<U, C, V, T> { }