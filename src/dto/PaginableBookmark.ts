import { IsString, IsOptional } from 'class-validator';
import * as _ from 'lodash';
import { IPaginableBookmark } from './IPaginableBookmark';
import { Filterable } from './Filterable';
import { IFilterable } from './IFilterable';

export class PaginableBookmark<U, V = any> extends Filterable<U, V> implements IPaginableBookmark<U, V> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static DEFAULT_PAGE_SIZE = 10;

    // --------------------------------------------------------------------------
    //
    //  Public Static Methods
    //
    // --------------------------------------------------------------------------

    public static transform<T extends IFilterable<U, V>, U, V>(item: T): T {
        item = Filterable.transform(item);
        if (_.isNil(item)) {
            return item;
        }
        let pageSize = item['pageSize'];
        item['pageSize'] = !_.isNil(pageSize) ? parseInt(pageSize.toString(), 10) : PaginableBookmark.DEFAULT_PAGE_SIZE;
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    public pageSize: number;

    @IsString()
    public pageBookmark: string;

    @IsOptional()
    public details?: Array<keyof U>;
}
