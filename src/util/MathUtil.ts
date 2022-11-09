import Decimal from 'decimal.js';
import * as _ from 'lodash';

export class MathUtil {
    // --------------------------------------------------------------------------
    //
    // 	Private Static Methods
    //
    // --------------------------------------------------------------------------

    private static _config: MathUtilConfig = { defaults: true };

    // --------------------------------------------------------------------------
    //
    // 	Static Properties
    //
    // --------------------------------------------------------------------------

    public static create(): Decimal.Constructor {
        return Decimal.set(MathUtil.config || { defaults: true });
    }

    public static new(value: Decimal.Value): Decimal {
        let item = MathUtil.create();
        return new item(value);
    }

    public static get config(): MathUtilConfig {
        return MathUtil._config;
    }

    public static set config(value: MathUtilConfig) {
        if (value === MathUtil._config) {
            return;
        }
        Decimal.set(value);
        MathUtil._config = value;
    }

    // --------------------------------------------------------------------------
    //
    // 	Static Methods
    //
    // --------------------------------------------------------------------------

    public static add(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(first).add(MathUtil.new(second)));
    }

    public static subtract(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(first).sub(MathUtil.new(second)));
    }

    public static multiply(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(first).mul(MathUtil.new(second)));
    }

    public static divide(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(first).dividedBy(MathUtil.new(second)));
    }

    public static ceil(value: string): string {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(value).ceil());
    }

    public static pow(value: string, n: string): string {
        if (MathUtil.isInvalid(value) || MathUtil.isInvalid(n)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(value).pow(MathUtil.new(n)));
    }

    public static floor(value: string): string {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(value).floor());
    }

    public static toString(value: Decimal.Value): string {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return value.toString();
    }

    public static toNumber(value: Decimal.Value): number {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return MathUtil.new(value).toNumber();
    }

    public static toHex(value: Decimal.Value): string {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return MathUtil.new(value).toHex();
    }

    public static isInvalid(value: Decimal.Value): boolean {
        return _.isNil(value);
    }

    // --------------------------------------------------------------------------
    //
    // 	Math Methods
    //
    // --------------------------------------------------------------------------

    public static max(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.greaterThanOrEqualTo(first, second) ? MathUtil.toString(first) : MathUtil.toString(second);
    }

    public static min(first: string, second: string): string {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            return null;
        }
        return MathUtil.lessThanOrEqualTo(first, second) ? MathUtil.toString(first) : MathUtil.toString(second);
    }

    public static abs(value: string): string {
        if (MathUtil.isInvalid(value)) {
            return null;
        }
        return MathUtil.toString(MathUtil.new(value).abs());
    }

    // --------------------------------------------------------------------------
    //
    // 	Compare Methods
    //
    // --------------------------------------------------------------------------

    public static lessThan(first: string, second: string): boolean {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            throw new Error(`Invalid arguments`);
        }
        return MathUtil.new(first).lessThan(MathUtil.new(second));
    }

    public static lessThanOrEqualTo(first: string, second: string): boolean {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            throw new Error(`Invalid arguments`);
        }
        return MathUtil.new(first).lessThanOrEqualTo(MathUtil.new(second));
    }

    public static greaterThan(first: string, second: string): boolean {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            throw new Error(`Invalid arguments`);
        }
        return MathUtil.new(first).greaterThan(MathUtil.new(second));
    }

    public static greaterThanOrEqualTo(first: string, second: string): boolean {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            throw new Error(`Invalid arguments`);
        }
        return MathUtil.new(first).greaterThanOrEqualTo(MathUtil.new(second));
    }

    public static equals(first: string, second: string): boolean {
        if (MathUtil.isInvalid(first) || MathUtil.isInvalid(second)) {
            throw new Error(`Invalid arguments`);
        }
        return MathUtil.new(first).equals(MathUtil.new(second));
    }
}

export type MathUtilConfig = Decimal.Config;
