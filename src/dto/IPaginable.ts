import { IFilterable } from './IFilterable';
import { IPage } from './IPage';

export interface IPaginable<U, V = any> extends IFilterable<U, V>, IPage { }
