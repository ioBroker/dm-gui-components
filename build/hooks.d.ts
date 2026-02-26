import type { Connection } from '@iobroker/adapter-react-v5';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
export declare function useStateOrObject<T extends ioBroker.StringOrTranslated | number | boolean>(item: ValueOrStateOrObject<T> | undefined, socket: Connection): T | undefined;
