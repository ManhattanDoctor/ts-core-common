import { ITraceable } from '../trace';
import { ObjectUtil } from '../util';
import { Filterable } from './Filterable';
import * as _ from 'lodash';

// --------------------------------------------------------------------------
//
//  Enum
//
// --------------------------------------------------------------------------

export let FilterableConditionRegExp = /[<=>]/g;

export enum FilterableConditionType {
    EQUAL = 'EQUAL',

    MORE = 'MORE',
    MORE_OR_EQUAL = 'MORE_OR_EQUAL',

    LESS = 'LESS',
    LESS_OR_EQUAL = 'LESS_OR_EQUAL',

    CONTAINS = 'CONTAINS',
    CONTAINS_SENSITIVE = 'CONTAINS_SENSITIVE',

    NULL = 'NULL',
    NOT_NULL = 'NOT_NULL',

    INCLUDES_ALL = 'INCLUDES_ALL',
    INCLUDES_ONE_OF = 'INCLUDES_ONE_OF',
}

export enum FilterableConditionUnion {
    OR = 'OR',
    AND = 'AND',
}
export enum FilterableDataType {
    DATE = 'DATE',
    ARRAY = 'ARRAY',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
}

// --------------------------------------------------------------------------
//
//  Interface
//
// --------------------------------------------------------------------------

export interface IFilterableProperties<T> {
    sort?: FilterableSort<T>;
    conditions?: FilterableConditions<T>;
}

export interface IFilterable<U, V = any> extends IFilterableProperties<U>, ITraceable {
    sortExtras?: FilterableSort<V>;
    conditionsExtras?: FilterableConditions<V>;
}

export interface IFilterableCondition<T = any> {
    value: IFilterableConditionValue<T>;
    condition: FilterableConditionType;

    path?: string;
    type?: FilterableDataType;
    union?: FilterableConditionUnion;
}

export type IFilterableConditionValue<T = any, P extends keyof T = any> = T[P] | number | string | Array<string | number>;

// --------------------------------------------------------------------------
//
//  Type
//
// --------------------------------------------------------------------------

export type FilterableSort<T> = { [P in keyof T]?: boolean };

export type FilterableConditions<T> = {
    [P in keyof T]?: T[P] | Array<T[P]> | IFilterableCondition<T>;
};

// --------------------------------------------------------------------------
//
//  Function
//
// --------------------------------------------------------------------------

export const IsFilterableCondition = <T>(value: any): value is IFilterableCondition<T> => {
    return ObjectUtil.instanceOf(value, ['condition', 'value']);
};

export const IsHasFilterableCondition = <T = any, P extends keyof T = any>(
    conditions: FilterableConditions<T>,
    name: P,
    value: IFilterableConditionValue<T>
): boolean => {
    if (_.isNil(conditions) || !ObjectUtil.hasOwnProperty(conditions, name)) {
        return false;
    }
    let item = conditions[name];
    if (item === value) {
        return true;
    }
    if (_.isArray(item) && item.includes(value)) {
        return true;
    }
    if (IsFilterableCondition(item)) {
        return item.condition === FilterableConditionType.EQUAL && item.value === value;
    }
    return false;
};

export const ToFilterableCondition = <T>(value: string, type: FilterableDataType, condition: FilterableConditionType, union?: FilterableConditionUnion): IFilterableCondition<T> => {
    if (Filterable.isValueInvalid(value)) {
        return null;
    }

    if (type === FilterableDataType.STRING) {
        switch (condition) {
            case FilterableConditionType.CONTAINS:
            case FilterableConditionType.CONTAINS_SENSITIVE:
                value = `%${value}%`;
                break;
        }
        return { value, type, condition, union };
    }

    let item: string | number = RemoveFilterableCondition(value);
    switch (type) {
        case FilterableDataType.NUMBER:
            item = Number(item);
            break;
        case FilterableDataType.DATE:
            item = Date.parse(item);
            break;
    }

    return {
        type,
        union,
        value: item,
        condition: GetFilterableConditionType(value, condition)
    };
};

export const GetFilterableCondition = <T>(value: T): string => {
    if (_.isNil(value)) {
        return null;
    }
    if (_.isString(value)) {
        let array = value.trim().match(FilterableConditionRegExp);
        return !_.isEmpty(array) ? array[0] : null;
    }
    return null;
};

export const GetFilterableConditionType = <T>(value: T, condition: FilterableConditionType): FilterableConditionType => {
    if (_.isNil(value)) {
        return condition;
    }

    switch (GetFilterableCondition(value)) {
        case '=':
            condition = FilterableConditionType.EQUAL;
            break;
        case '>':
            condition = FilterableConditionType.MORE;
            break;
        case '<':
            condition = FilterableConditionType.LESS;
            break;
    }
    return condition;
};

export const RemoveFilterableCondition = (value: string): string => {
    return _.isString(value) ? value.replace(FilterableConditionRegExp, '').trim() : value;
};

export const ParseFilterableCondition = <T, P extends keyof T>(
    conditions: FilterableConditions<T>,
    name: P,
    type: FilterableDataType,
    condition: FilterableConditionType = FilterableConditionType.EQUAL,
    union: FilterableConditionUnion = FilterableConditionUnion.AND,
    transform?: (value: T[P] | IFilterableCondition<T>, conditions: FilterableConditions<T>, name: P) => string,
): void => {
    ParseFilterableConditionExtra(conditions, name as string, type, condition, union, transform as any);
};

export const ParseFilterableConditionExtra = (
    conditions: any,
    name: string,
    type: FilterableDataType,
    condition: FilterableConditionType = FilterableConditionType.EQUAL,
    union: FilterableConditionUnion = FilterableConditionUnion.AND,
    transform?: (value: any, conditions: any, name: string) => string
): void => {
    if (_.isEmpty(conditions) || _.isNil(name) || !ObjectUtil.hasOwnProperty(conditions, name)) {
        return;
    }

    let value = conditions[name];
    if (!_.isNil(value)) {
        if (!_.isNil(transform)) {
            value = transform(value, conditions, name);
        }
        else if (!_.isArray(value)) {
            value = value.toString();
        }
    }

    let item = ToFilterableCondition(value, type, condition, union);
    if (!_.isNil(item)) {
        conditions[name] = item;
    } else {
        delete conditions[name];
    }
};
