import * as _ from 'lodash';
import { Filterable } from './Filterable';
import { IPaginable } from './IPaginable';

export class Paginable<U, V = any> extends Filterable<U> implements IPaginable<U, V> {
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

    public static transform<U, V>(item: IPaginable<U, V>): Paginable<U, V> {
        if (_.isNil(item)) {
            return item;
        }
        item = Filterable.transform(item) as IPaginable<U, V>;
        item.pageSize = !_.isNil(item.pageSize) ? parseInt(item.pageSize.toString(), 10) : Paginable.DEFAULT_PAGE_SIZE;
        item.pageIndex = !_.isNil(item.pageIndex) ? parseInt(item.pageIndex.toString(), 10) : Paginable.DEFAULT_PAGE_INDEX;
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    pageSize: number;
    pageIndex: number;
}
