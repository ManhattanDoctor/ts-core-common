import { ExtendedError } from './ExtendedError';

export class UnreachableStatementError extends ExtendedError<void, string> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static ERROR_CODE = 'UNREACHABLE_STATEMENT_ERROR';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(value: never) {
        super(`Unreachable statement: ${value}`, UnreachableStatementError.ERROR_CODE);
    }
}
