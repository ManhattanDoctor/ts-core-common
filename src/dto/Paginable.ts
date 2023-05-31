import * as _ from 'lodash';
import { Filterable } from './Filterable';
import { IFilterable } from './IFilterable';
import { IPaginable } from './IPaginable';

export class Paginable<U, V = any> extends Filterable<U, V> implements IPaginable<U, V> {
    // --------------------------------------------------------------------------
    //
    //  Constants
    //
    // --------------------------------------------------------------------------

    public static DEFAULT_PAGE_SIZE = 10;
    public static DEFAULT_PAGE_INDEX = 0;

    // --------------------------------------------------------------------------
    //
    //  Public Static Methods
    //
    // --------------------------------------------------------------------------

    public static override transform<T extends IFilterable<U, V>, U, V>(item: T): T {
        if (_.isNil(item)) {
            return item;
        }
        item = Filterable.transform(item);

        let pageSize = item['pageSize'];
        let pageIndex = item['pageIndex'];
        item['pageSize'] = !_.isNil(pageSize) ? parseInt(pageSize.toString(), 10) : Paginable.DEFAULT_PAGE_SIZE;
        item['pageIndex'] = !_.isNil(pageIndex) ? parseInt(pageIndex.toString(), 10) : Paginable.DEFAULT_PAGE_INDEX;
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    public pageSize: number;
    public pageIndex: number;
}
