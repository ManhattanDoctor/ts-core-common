import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import * as _ from 'lodash';

export function IsOneOfEnums(entities: Array<any>, options?: ValidationOptions): Function {
    entities = _.compact(entities);
    return (object: any, propertyName: string): void => {
        registerDecorator({
            name: 'IsOneOfEnums',
            target: object.constructor,
            propertyName,
            constraints: [propertyName],
            options: options,
            validator: {
                validate: (value: any, validationArguments?: ValidationArguments): boolean => isOneOfEnums(value, entities, options),
                defaultMessage: (validationArguments?: ValidationArguments): string => `${propertyName} must be one of enums`
            }
        });
    };
}

export function isOneOfEnums(value: any, entities: Array<any>, options?: ValidationOptions): boolean {
    return entities.some(item => Object.values(item).includes(value));
}
