import { Exclude, Transform } from 'class-transformer';
import * as _ from 'lodash';
import { ObjectUtil, TransformUtil } from '../util';

export class ExtendedError<U = any, V = number> extends Error implements Error {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static DEFAULT_ERROR_CODE = -1000;
    public static DEFAULT_ERROR_MESSAGE = 'Default extended error';

    public static HTTP_CODE_BAD_REQUEST = 400;
    public static HTTP_CODE_UNAUTHORIZED = 401;
    public static HTTP_CODE_PAYMENT_REQUIRED = 402;
    public static HTTP_CODE_FORBIDDEN = 403;
    public static HTTP_CODE_NOT_FOUND = 404;
    public static HTTP_CODE_METHOD_NOT_ALLOWED = 405;
    public static HTTP_CODE_ACCEPTABLE = 406;
    public static HTTP_CODE_PROXY_AUTHENTICATION_REQUIRED = 407;
    public static HTTP_CODE_REQUEST_TIMEOUT = 408;
    public static HTTP_CODE_CONFLICT = 409;
    public static HTTP_CODE_GONE = 410;
    public static HTTP_CODE_LENGTH_REQUIRED = 411;
    public static HTTP_CODE_PRECONDITION_FAILED = 412;
    public static HTTP_CODE_PAYLOAD_TOO_LARGE = 413;
    public static HTTP_CODE_URI_TOO_LONG = 414;
    public static HTTP_CODE_UNSUPPORTED_MEDIA_TYPE = 415;
    public static HTTP_CODE_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
    public static HTTP_CODE_EXPECTATION_FAILED = 417;
    public static HTTP_CODE_I_AM_A_TEAPOT = 418;
    public static HTTP_CODE_UNPROCESSABLE_ENTITY = 422;
    public static HTTP_CODE_FAILED_DEPENDENCY = 424;
    public static HTTP_CODE_TOO_MANY_REQUESTS = 429;
    public static HTTP_CODE_INTERNAL_SERVER_ERROR = 500;
    public static HTTP_CODE_NOT_IMPLEMENTED = 501;
    public static HTTP_CODE_BAD_GATEWAY = 502;
    public static HTTP_CODE_SERVICE_UNAVAILABLE = 503;
    public static HTTP_CODE_GATEWAY_TIMEOUT = 504;
    public static HTTP_CODE_HTTP_VERSION_NOT_SUPPORTED = 505;

    // --------------------------------------------------------------------------
    //
    //  Public Static
    //
    // --------------------------------------------------------------------------

    public static create(item: Error | ExtendedError | any, code?: any): ExtendedError {
        if (item instanceof ExtendedError) {
            return item;
        }

        if (_.isNil(code)) {
            code = ExtendedError.DEFAULT_ERROR_CODE;
        }
        let details = null;
        let message = null;
        if (item instanceof Error) {
            details = item.stack;
            message = item.message;
            if (!_.isEmpty(item.name)) {
                message = `[${item.name}] ${message}`;
            }
            return new ExtendedError(message, code, details);
        }

        message = ExtendedError.DEFAULT_ERROR_MESSAGE;
        if (!_.isNil(item.code)) {
            code = item.code;
        }
        if (!_.isNil(item.message)) {
            message = item.message;
        }
        if (!_.isNil(item.details)) {
            details = item.details;
        }
        return new ExtendedError(message, code, details);
    }

    public static instanceOf(data: any): data is ExtendedError {
        return ObjectUtil.instanceOf<ExtendedError>(data, ['code', 'message', 'details']);
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    public code: V;
    public message: string;
    public isFatal: boolean;

    @Exclude({ toPlainOnly: true })
    public stack: string;

    @Transform(params => (!_.isNil(params.value) ? TransformUtil.toJSON(params.value) : null), { toClassOnly: true })
    @Transform(params => (!_.isNil(params.value) ? TransformUtil.fromJSON(params.value) : null), { toPlainOnly: true })
    public details: U;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(message: string, code: V = null, details: U = null, isFatal: boolean = true) {
        super(message);
        Object.defineProperty(this, 'stack', { enumerable: true, writable: true });
        Object.defineProperty(this, 'message', { enumerable: true, writable: true });

        this.code = !_.isNil(code) ? code : (ExtendedError.DEFAULT_ERROR_CODE as any);
        this.message = message;
        this.details = details;
        this.isFatal = _.isBoolean(isFatal) ? isFatal : true;
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public toObject(): any {
        return TransformUtil.fromClass(this);
    }

    public toString(): string {
        let value = this.message;
        if (!_.isNil(this.code)) {
            value += ` (${this.code})`;
        }
        if (!_.isNil(this.details)) {
            let details = this.details.toString();
            if (_.isObjectLike(this.details)) {
                details = JSON.stringify(this.details, null, 4);
            } else if (_.isString(this.details) && ObjectUtil.isJSON(this.details)) {
                details = JSON.stringify(JSON.parse(this.details), null, 4);
            }
            value += `\n${details}`;
        }
        return value;
    }
}
