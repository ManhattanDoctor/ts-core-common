import * as _ from 'lodash';

export class StringUtil {
    // --------------------------------------------------------------------------
    //
    //	Static Methods
    //
    // --------------------------------------------------------------------------

    public static toHexColor(item: string, isNeedPrefix: boolean = true): string {
        if (_.isEmpty(item)) {
            return isNeedPrefix ? '#000000' : '000000';
        }

        let hash = 0;
        for (let i = 0; i < item.length; i++) {
            hash = item.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        let color = isNeedPrefix ? '#' : '';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 255;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }
}
