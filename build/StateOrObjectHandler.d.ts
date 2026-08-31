import type { Connection } from '@iobroker/gui-components';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
export interface StateOrObjectSubscription {
    unsubscribe: () => Promise<void> | void;
}
export declare class StateOrObjectHandler {
    private readonly socket;
    private readonly objectSubs;
    private readonly stateSubs;
    private destroyed;
    constructor(socket: Connection);
    /** Unsubscribe everything. To be called when the component owning this handler is unmounted */
    destroy(): void;
    addListener<T extends ioBroker.StringOrTranslated | number | boolean>(item: ValueOrStateOrObject<T> | undefined, callback: (value: T | undefined) => void): Promise<StateOrObjectSubscription>;
    private addObjectListener;
    private addStateListener;
}
