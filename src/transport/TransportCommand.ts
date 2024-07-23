
import { ITransportCommand } from './ITransport';
import { ValidateUtil } from '../util';
import { IsString, IsDefined } from 'class-validator';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';

export class TransportCommand<T> implements ITransportCommand<T> {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    @IsString()
    public id: string;

    @IsString()
    public name: string;

    @IsDefined()
    public request: T;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(name: string, request?: T, id?: string) {
        this.id = !_.isNil(id) ? id : uuid();
        this.name = name;
        this.request = this.validateRequest(!_.isNil(request) ? request : {} as T);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected validateRequest(value: T): T {
        ValidateUtil.validate(value);
        return value;
    }
}
