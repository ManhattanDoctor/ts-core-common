import * as _ from 'lodash';

export class DateUtil {
    // --------------------------------------------------------------------------
    //
    //  Static Properties
    //
    // --------------------------------------------------------------------------

    public static MILLISECONDS_YEAR = 12 * 30 * 24 * 60 * 60 * 1000;
    public static MILLISECONDS_MONTH = 30 * 24 * 60 * 60 * 1000;
    public static MILLISECONDS_DAY = 24 * 60 * 60 * 1000;
    public static MILLISECONDS_HOUR = 60 * 60 * 1000;
    public static MILLISECONDS_MINUTE = 60 * 1000;
    public static MILLISECONDS_SECOND = 1000;
    public static MILLISECONDS_NANOSECOND = 1 / 1000000;

    /**
     * @deprecated Use MILLISECONDS_YEAR instead
     */
    public static MILISECONDS_YEAR = DateUtil.MILLISECONDS_YEAR;
    /**
     * @deprecated Use MILLISECONDS_MONTH instead
     */
    public static MILISECONDS_MONTH = DateUtil.MILLISECONDS_MONTH;
    /**
     * @deprecated Use MILLISECONDS_DAY instead
     */
    public static MILISECONDS_DAY = DateUtil.MILLISECONDS_DAY;
    /**
     * @deprecated Use MILLISECONDS_HOUR instead
     */
    public static MILISECONDS_HOUR = DateUtil.MILLISECONDS_HOUR;
    /**
     * @deprecated Use MILLISECONDS_MINUTE instead
     */
    public static MILISECONDS_MINUTE = DateUtil.MILLISECONDS_MINUTE;
    /**
     * @deprecated Use MILLISECONDS_SECOND instead
     */
    public static MILISECONDS_SECOND = DateUtil.MILLISECONDS_SECOND;
    /**
     * @deprecated Use MILISECONDS_NANOSECOND instead
     */
    public static MILISECONDS_NANOSECOND = DateUtil.MILLISECONDS_NANOSECOND;


    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static getTime(value: any): number {
        let date = DateUtil.parseDate(value);
        return date ? date.getTime() : NaN;
    }

    public static getDate(time: number): Date {
        let date = new Date();
        date.setTime(time);
        return date;
    }

    public static parseDate(value: any, splitter: string = '.'): Date {
        if (_.isDate(value)) {
            return value;
        }
        if (_.isNumber(value)) {
            return DateUtil.getDate(value);
        }
        if (_.isString(value)) {
            return DateUtil.parseDate(value.split(splitter));
        }
        if (_.isArray(value)) {
            if (value.length !== 3) {
                return null;
            }
            value = value.map(item => Number(item));
            if (value.some(item => _.isNaN(item))) {
                return null;
            }
            return new Date(value[2], value[1], value[0]);
        }
        return null;
    }

    public isEqual(first: Date, second: Date): boolean {
        if (first === second) {
            return true;
        }
        if (_.isNil(first) || _.isNil(second)) {
            return false;
        }
        return first.getTime() == second.getTime();
    }

    public static isUnknown(date: Date): boolean {
        return _.isNil(date);
    }
}
