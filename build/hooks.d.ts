import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
export declare function useStateOrObject<T extends ioBroker.StringOrTranslated | number | boolean>(item: ValueOrStateOrObject<T> | undefined, stateOrObjectHandler: StateOrObjectHandler): T | undefined;
