import * as _ from 'lodash';
import { Filterable } from '../../dto/Filterable';
import { FilterableConditions, FilterableSort, IFilterable, IsFilterableCondition } from '../../dto/IFilterable';
import { ExtendedError } from '../../error';
import { ObjectUtil } from '../../util';
import { DataSourceMapCollection } from './DataSourceMapCollection';

export abstract class FilterableDataSourceMapCollection<U, V = any, T = any> extends DataSourceMapCollection<U, V> {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _sort: FilterableSort<U> = {};
    protected _sortExtras: FilterableSort<T> = {};

    protected _conditions: FilterableConditions<U> = {};
    protected _conditionsExtras: FilterableConditions<T> = {};

    // --------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    // --------------------------------------------------------------------------

    protected createRequestData(): IFilterable<U, T> {
        let data: IFilterable<U, T> = {};
        let sort = this.createSortForRequest(this.sort);
        let sortExtras = this.createSortExtrasForRequest(this.sortExtras);
        let conditions = this.createConditionsForRequest(this.conditions);
        let conditionsExtras = this.createConditionsExtrasForRequest(this.conditionsExtras);
        if (!_.isEmpty(sort)) {
            data.sort = sort;
        }
        if (!_.isEmpty(sortExtras)) {
            data.sortExtras = sortExtras;
        }
        if (!_.isEmpty(conditions)) {
            data.conditions = conditions;
        }
        if (!_.isEmpty(conditionsExtras)) {
            data.conditionsExtras = conditionsExtras;
        }
        return data;
    }

    protected createSortForRequest<U>(sort: FilterableSort<U>): FilterableSort<U> {
        if (_.isEmpty(sort)) {
            return null;
        }
        let item = _.cloneDeep(sort);
        for (let pair of Object.entries(item)) {
            if (Filterable.isValueInvalid(pair[1])) {
                delete item[pair[0]];
            }
        }
        return item;
    }

    protected createConditionsForRequest<U>(conditions: FilterableConditions<U>): FilterableConditions<U> {
        if (_.isEmpty(conditions)) {
            return null;
        }
        let item = _.cloneDeep(conditions);
        for (let pair of Object.entries(item)) {
            let value = pair[1];
            if (IsFilterableCondition(value)) {
                value = value.value;
            }
            if (Filterable.isValueInvalid(value)) {
                delete item[pair[0]];
            }
        }
        return item;
    }

    protected createSortExtrasForRequest(sort: FilterableSort<T>): FilterableSort<T> {
        return this.createSortForRequest(sort);
    }
    
    protected createConditionsExtrasForRequest(conditions: FilterableConditions<T>): FilterableConditions<T> {
        return this.createConditionsForRequest(conditions);
    }

    protected parseError(error: ExtendedError): void {
        super.parseError(error);
        this.clear();
    }


    // --------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    // --------------------------------------------------------------------------

    public conditionsSortClear(isReloadAfter: boolean = true): void {
        ObjectUtil.clear(this.sort);
        ObjectUtil.clear(this.sortExtras);
        if (isReloadAfter) {
            this.reload();
        }
    }

    public conditionsClear(isReloadAfter: boolean = true): void {
        ObjectUtil.clear(this.conditions);
        ObjectUtil.clear(this.conditionsExtras);
        if (isReloadAfter) {
            this.reload();
        }
    }

    /*
    public async reload(): Promise<void> {
        // this.setLength(0);
        // this.clear();
        return super.reload();
    }
    */

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

        this._sort = null;
        this._conditions = null;
    }

    // --------------------------------------------------------------------------
    //
    // 	Public Properties
    //
    // --------------------------------------------------------------------------

    public get sort(): FilterableSort<U> {
        return this._sort;
    }

    public get sortExtras(): FilterableSort<T> {
        return this._sortExtras;
    }

    public get conditions(): FilterableConditions<U> {
        return this._conditions;
    }

    public get conditionsExtras(): FilterableConditions<T> {
        return this._conditionsExtras;
    }
}
