import { AxiosError } from "axios";
import * as _ from 'lodash';
import { ExtendedError } from "./ExtendedError";

export function isAxiosError(item: any): item is AxiosError {
    if (item instanceof AxiosError) {
        return true;
    }
    if (_.isNil(item)) {
        return false;
    }
    return _.isBoolean(item.isAxiosError) ? item.isAxiosError : false;
}

export function parseAxiosError(item: AxiosError): ExtendedError {
    let response = item.response;
    if (_.isNil(response) || _.isNil(response.data)) {
        let status = ExtendedError.HTTP_CODE_BAD_REQUEST;
        let message = !_.isEmpty(item.message) ? item.message : item.toString();
        return new ExtendedError(message, status, item);
    }
    if (ExtendedError.instanceOf(response.data)) {
        return ExtendedError.create(response.data);
    }
    let message = response.statusText;
    if (_.isEmpty(message)) {
        let error = _.get(response, 'data.error');
        if (_.isEmpty(message) && !_.isEmpty(error)) {
            message = error;
        }
    }
    return new ExtendedError(message, response.status, response.data);
}