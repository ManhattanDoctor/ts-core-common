import { IsOptional } from 'class-validator';
import * as _ from 'lodash';
import { TraceUtil } from '../trace';
import { DateUtil } from '../util';
import { FilterableConditions, FilterableDataType, FilterableSort, IFilterable, IFilterableCondition, IsFilterableCondition } from './IFilterable';

export class Filterable<U, V = any> implements IFilterable<U, V> {
    // --------------------------------------------------------------------------
    //
    //  Public Static Methods
    //
    // --------------------------------------------------------------------------

    public static transform<T extends IFilterable<U, V>, U, V>(item: T): T {
        if (_.isNil(item)) {
            return item;
        }
        TraceUtil.addIfNeed(item);
        if (!_.isNil(item.sort)) {
            item.sort = Filterable.parse(item.sort, Filterable.transformSort);
        }
        if (!_.isNil(item.sortExtras)) {
            item.sortExtras = Filterable.parse(item.sortExtras, Filterable.transformSort);
        }
        if (!_.isNil(item.conditions)) {
            item.conditions = Filterable.parse(item.conditions, Filterable.transformCondition);
        }
        if (!_.isNil(item.conditionsExtras)) {
            item.conditionsExtras = Filterable.parse(item.conditionsExtras, Filterable.transformCondition);
        }
        return item;
    }

    public static check(value: any): any {
        if (_.isEmpty(value)) {
            return value;
        }
        if (_.isString(value)) {
            value = Filterable.check(JSON.parse(value));
        }
        return value;
    }

    public static parse(value: any, transform: (item: any, key: string, value: any) => void): any {
        value = Filterable.check(value);
        if (_.isNil(value)) {
            return value;
        }
        for (let pair of Object.entries(value)) {
            transform(value, pair[0], pair[1]);
        }
        return value;
    }

    public static isValueInvalid(value: any): boolean {
        if (_.isBoolean(value) || _.isNull(value)) {
            return false;
        }
        if (_.isNumber(value)) {
            return _.isNaN(value);
        }
        return _.isEmpty(value) || _.isUndefined(value);
    }

    // --------------------------------------------------------------------------
    //
    //  Transform Methods
    //
    // --------------------------------------------------------------------------

    public static transformCondition(item: any, key: string, value: any): void {
        if (IsFilterableCondition(value)) {
            Filterable.transformFilterableCondition(item, key, value);
            return;
        }
        if (Filterable.isValueInvalid(value)) {
            delete item[key];
            return;
        }
    }

    public static transformSort(item: any, key: string, value: any): void {
        return Filterable.transformCondition(item, key, value);
    }

    private static transformFilterableCondition(item: any, key: string, condition: IFilterableCondition): void {
        let value = condition.value;
        if (Filterable.isValueInvalid(value)) {
            delete item[key];
            return;
        }
        if (condition.type === FilterableDataType.DATE) {
            if (!_.isNumber(value)) {
                value = parseInt(value, 10);
            }
            if (!_.isNaN(value)) {
                condition.value = DateUtil.getDate(value);
            }
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    @IsOptional()
    sort?: FilterableSort<U>;

    @IsOptional()
    sortExtras?: FilterableSort<V>;

    @IsOptional()
    conditions?: FilterableConditions<U>;

    @IsOptional()
    conditionsExtras?: FilterableConditions<V>;
}
