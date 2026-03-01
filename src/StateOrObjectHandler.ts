import type { Connection, ObjectChangeHandler } from '@iobroker/adapter-react-v5';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';

interface ObjectSubscription {
    notifiers: ((obj?: ioBroker.Object | null) => void)[];
    handler: ObjectChangeHandler;
    loaded: boolean;
    cached: ioBroker.Object | null | undefined;
}

interface StateSubscription {
    notifiers: ((state?: ioBroker.State | null) => void)[];
    handler: ioBroker.StateChangeHandler;
    loaded: boolean;
    cached: ioBroker.State | null | undefined;
}

export class StateOrObjectHandler {
    private readonly objectSubs = new Map<string, ObjectSubscription>();
    private readonly stateSubs = new Map<string, StateSubscription>();

    constructor(private readonly socket: Connection) {}

    public async addListener<T extends ioBroker.StringOrTranslated | number | boolean>(
        item: ValueOrStateOrObject<T> | undefined,
        callback: (value: T | undefined) => void,
    ): Promise<void> {
        if (item === undefined) {
            callback(undefined);
            return;
        }

        if (typeof item !== 'object') {
            callback(item);
            return;
        }

        if ('en' in item) {
            callback(item as T);
            return;
        }

        try {
            if ('objectId' in item) {
                const notifyValue = (obj?: ioBroker.Object | null): void => {
                    if (!obj) {
                        callback(undefined);
                        return;
                    }

                    const parts = item.property.split('.');
                    let current: any = obj;
                    for (const part of parts) {
                        if (current[part] === undefined) {
                            callback(undefined);
                            return;
                        }
                        current = current[part];
                    }

                    callback(current as T);
                };

                const existing = this.objectSubs.get(item.objectId);
                if (existing) {
                    existing.notifiers.push(notifyValue);
                    if (existing.loaded) {
                        // Already have the value — notify immediately without re-fetching
                        notifyValue(existing.cached);
                    }
                    // If still loading, notifyValue will be called once the load completes
                    return;
                }

                const sub: ObjectSubscription = {
                    notifiers: [notifyValue],
                    handler: null!,
                    loaded: false,
                    cached: undefined,
                };
                this.objectSubs.set(item.objectId, sub);

                const handler: ObjectChangeHandler = (_id, obj) => {
                    sub.cached = obj;
                    for (const n of sub.notifiers) {
                        n(obj);
                    }
                };
                sub.handler = handler;

                const obj = await this.socket.getObject(item.objectId);
                sub.cached = obj;
                sub.loaded = true;
                // Notify all notifiers (including any added while the fetch was in progress)
                for (const n of sub.notifiers) {
                    n(obj);
                }
                await this.socket.subscribeObject(item.objectId, handler);
                return;
            }

            if ('stateId' in item) {
                const notifyValue = (state?: ioBroker.State | null): void => {
                    let val = state?.val;
                    if (val === undefined || val === null) {
                        callback(undefined);
                        return;
                    }

                    if (item.mapping) {
                        if (typeof val === 'boolean') {
                            val = val.toString();
                        }

                        callback(item.mapping[val]);
                    } else {
                        callback(val as T);
                    }
                };

                const existing = this.stateSubs.get(item.stateId);
                if (existing) {
                    existing.notifiers.push(notifyValue);
                    if (existing.loaded) {
                        // Already have the value — notify immediately without re-fetching
                        notifyValue(existing.cached);
                    }
                    // If still loading, notifyValue will be called once the load completes
                    return;
                }

                const sub: StateSubscription = {
                    notifiers: [notifyValue],
                    handler: null!,
                    loaded: false,
                    cached: undefined,
                };
                this.stateSubs.set(item.stateId, sub);

                const handler: ioBroker.StateChangeHandler = (_id, state) => {
                    sub.cached = state;
                    for (const n of sub.notifiers) {
                        n(state);
                    }
                };
                sub.handler = handler;

                const state = await this.socket.getState(item.stateId);
                sub.cached = state;
                sub.loaded = true;
                // Notify all notifiers (including any added while the fetch was in progress)
                for (const n of sub.notifiers) {
                    n(state);
                }
                await this.socket.subscribeState(item.stateId, handler);
                return;
            }
        } catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }

        callback(undefined);
    }

    public async unsubscribe(): Promise<void> {
        for (const [id, sub] of this.objectSubs) {
            await this.socket.unsubscribeObject(id, sub.handler);
        }
        this.objectSubs.clear();

        for (const [id, sub] of this.stateSubs) {
            this.socket.unsubscribeState(id, sub.handler);
        }
        this.stateSubs.clear();
    }
}
