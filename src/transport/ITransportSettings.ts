import { TransportCommandWaitDelay } from './ITransport';

export interface ITransportSettings {
    timeout?: number;
    defaultWaitDelay?: TransportCommandWaitDelay;
    defaultWaitMaxCount?: number;
}
