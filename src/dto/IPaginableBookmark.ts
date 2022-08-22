import { IPageBookmark } from './IPageBookmark';
import { IFilterable } from './IFilterable';

export interface IPaginableBookmark<U, V = any> extends IFilterable<U, V>, IPageBookmark {
    details?: Array<keyof U>;
}
