import { ExtendedError } from '../../error';

export class TransportInvalidDataError extends ExtendedError<void, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'TRANSPORT_INVALID_DATA';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(message: string, data: any) {
        super(message, TransportInvalidDataError.ERROR_CODE, data);
    }
}
