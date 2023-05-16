import { ExtendedError } from '../../error';
import * as _ from 'lodash';

export class TransportWaitError extends ExtendedError<void, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'TRANSPORT_WAIT_ERROR';

    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static instanceOf(data: any): data is TransportWaitError {
        return data instanceof TransportWaitError || data.code === TransportWaitError.ERROR_CODE;
    }

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(message: string) {
        super(message, TransportWaitError.ERROR_CODE);
    }
}
