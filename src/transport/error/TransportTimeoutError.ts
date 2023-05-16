import { ExtendedError } from '../../error';
import { ITransportCommand } from '../ITransport';

export class TransportTimeoutError<U> extends ExtendedError<ITransportCommand<U>, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'TRANSPORT_TIMEOUT_ERROR';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(command: ITransportCommand<U>) {
        super(`${command.name} (${command.id}) is timed out`, TransportTimeoutError.ERROR_CODE);
    }
}
