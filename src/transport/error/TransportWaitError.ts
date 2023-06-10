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

    public static instanceOf(item: any): item is TransportWaitError {
        if (_.isNil(item)) {
            return false;
        }
        return item instanceof TransportWaitError || item.code === TransportWaitError.ERROR_CODE;
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
