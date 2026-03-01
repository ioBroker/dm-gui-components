import type { Connection } from '@iobroker/adapter-react-v5';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
export declare class StateOrObjectHandler {
    private readonly socket;
    private readonly unsubscribes;
    constructor(socket: Connection);
    addListener<T extends ioBroker.StringOrTranslated | number | boolean>(item: ValueOrStateOrObject<T> | undefined, callback: (value: T | undefined) => void): Promise<void>;
    unsubscribe(): Promise<void>;
}
