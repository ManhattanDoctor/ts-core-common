import * as _ from 'lodash';
import { Filterable } from '../../dto/Filterable';
import { FilterableConditions, FilterableSort, IFilterable, IsFilterableCondition } from '../../dto/IFilterable';
import { ObjectUtil } from '../../util';
import { DataSourceMapCollection } from './DataSourceMapCollection';

export abstract class FilterableDataSourceMapCollection<U, V = any> extends DataSourceMapCollection<U, V> {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _sort: FilterableSort<U> = {};
    protected _conditions: FilterableConditions<U> = {};
    protected _conditionsExtras: any = {};

    // --------------------------------------------------------------------------
    //
    // 	Protected Methods
    //
    // --------------------------------------------------------------------------

    protected createRequestData(): IFilterable<U> {
        let data: IFilterable<U> = {};
        let sort = this.createSortForRequest(this.sort);
        let conditions = this.createConditionsForRequest(this.conditions);
        let conditionsExtras = this.createConditionsExtrasForRequest(this.conditionsExtras);
        if (!_.isEmpty(sort)) {
            data.sort = sort;
        }
        if (!_.isEmpty(conditions)) {
            data.conditions = conditions;
        }
        if (!_.isEmpty(conditionsExtras)) {
            data.conditionsExtras = conditionsExtras;
        }
        return data;
    }

    protected createSortForRequest(sort: FilterableSort<U>): FilterableSort<U> {
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

    protected createConditionsForRequest(conditions: FilterableConditions<U>): FilterableConditions<U> {
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

    protected createConditionsExtrasForRequest(conditions: any): any {
        return this.createConditionsForRequest(conditions);
    }

    // --------------------------------------------------------------------------
    //
    // 	Public Methods
    //
    // --------------------------------------------------------------------------

    public conditionsSort(isLoadAfter: boolean = true): void {
        ObjectUtil.clear(this.sort);
        if (isLoadAfter) {
            this.load();
        }
    }

    public conditionsClear(isReloadAfter: boolean = true): void {
        ObjectUtil.clear(this.conditions);
        if (isReloadAfter) {
            this.reload();
        }
    }

    public async reload(): Promise<void> {
        this.setLength(0);
        return super.reload();
    }

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

    public get conditions(): FilterableConditions<U> {
        return this._conditions;
    }

    public get conditionsExtras(): any {
        return this._conditionsExtras;
    }
}
