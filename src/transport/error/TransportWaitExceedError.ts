import { ExtendedError } from '../../error';
import { ITransportCommand } from '../ITransport';

export class TransportWaitExceedError<U = any> extends ExtendedError<ITransportCommand<U>, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'TRANSPORT_WAIT_EXCEED_ERROR';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(command: ITransportCommand<U>) {
        super(`${command.name} (${command.id}) wait timeout or count exceeded`, TransportWaitExceedError.ERROR_CODE);
    }
}
