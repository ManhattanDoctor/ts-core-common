import { ExtendedError } from '../../error';
import { ITransportCommand } from '../ITransport';

export class TransportNoConnectionError<U> extends ExtendedError<ITransportCommand<U>, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'TRANSPORT_NO_CONNECTION_ERROR';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(command: ITransportCommand<U>) {
        super(`${command.name} (${command.id}) no connection`, TransportNoConnectionError.ERROR_CODE);
    }
}
