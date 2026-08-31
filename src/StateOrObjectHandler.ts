import type { Connection, ObjectChangeHandler } from '@iobroker/gui-components';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';

type ObjectSubscriptionNotifier = (obj?: ioBroker.Object | null) => void;

interface ObjectSubscription {
    notifiers: ObjectSubscriptionNotifier[];
    handler: ObjectChangeHandler;
    unsubscribe: (notifier: ObjectSubscriptionNotifier) => Promise<void>;
    loaded: boolean;
    cached: ioBroker.Object | null | undefined;
    /** Set while the subscription is waiting for the grace period after its last notifier left */
    lingerTimer?: ReturnType<typeof setTimeout>;
}

type StateSubscriptionNotifier = (state?: ioBroker.State | null) => void;

interface StateSubscription {
    notifiers: StateSubscriptionNotifier[];
    handler: ioBroker.StateChangeHandler;
    unsubscribe: (notifier: StateSubscriptionNotifier) => void;
    loaded: boolean;
    cached: ioBroker.State | null | undefined;
    /** Set while the subscription is waiting for the grace period after its last notifier left */
    lingerTimer?: ReturnType<typeof setTimeout>;
}

export interface StateOrObjectSubscription {
    unsubscribe: () => Promise<void> | void;
}

const emptySubscription: StateOrObjectSubscription = {
    unsubscribe: () => {},
};

/**
 * How long a subscription without any listener is kept before it is really unsubscribed.
 *
 * The cards of the device list are mounted and unmounted while scrolling. Without this grace period
 * every card that scrolls in and out again would cause a new `getObject`/`getState` round trip plus
 * a new subscription on the socket.
 */
const UNSUBSCRIBE_GRACE_MS = 10_000;

export class StateOrObjectHandler {
    private readonly objectSubs = new Map<string, ObjectSubscription>();
    private readonly stateSubs = new Map<string, StateSubscription>();

    private destroyed = false;

    constructor(private readonly socket: Connection) {}

    /** Unsubscribe everything. To be called when the component owning this handler is unmounted */
    public destroy(): void {
        this.destroyed = true;
        for (const [objectId, sub] of this.objectSubs) {
            if (sub.lingerTimer) {
                clearTimeout(sub.lingerTimer);
            }
            sub.notifiers.length = 0;
            void this.socket.unsubscribeObject(objectId, sub.handler);
        }
        this.objectSubs.clear();

        for (const [stateId, sub] of this.stateSubs) {
            if (sub.lingerTimer) {
                clearTimeout(sub.lingerTimer);
            }
            sub.notifiers.length = 0;
            this.socket.unsubscribeState(stateId, sub.handler);
        }
        this.stateSubs.clear();
    }

    public async addListener<T extends ioBroker.StringOrTranslated | number | boolean>(
        item: ValueOrStateOrObject<T> | undefined,
        callback: (value: T | undefined) => void,
    ): Promise<StateOrObjectSubscription> {
        if (item === undefined) {
            callback(undefined);
            return emptySubscription;
        }

        if (typeof item !== 'object') {
            callback(item);
            return emptySubscription;
        }

        if ('en' in item) {
            callback(item as T);
            return emptySubscription;
        }

        try {
            if ('objectId' in item) {
                return this.addObjectListener(item.objectId, item.property, callback);
            }

            if ('stateId' in item) {
                return this.addStateListener(item.stateId, item.mapping, callback);
            }
        } catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }

        callback(undefined);
        return emptySubscription;
    }

    private async addObjectListener<T extends ioBroker.StringOrTranslated | number | boolean>(
        objectId: string,
        property: string,
        callback: (value: T | undefined) => void,
    ): Promise<StateOrObjectSubscription> {
        const notifyValue = (obj?: ioBroker.Object | null): void => {
            if (!obj) {
                callback(undefined);
                return;
            }

            const parts = property.split('.');
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

        const existing = this.objectSubs.get(objectId);
        if (existing) {
            if (existing.lingerTimer) {
                // The subscription was about to be dropped - take it over instead
                clearTimeout(existing.lingerTimer);
                existing.lingerTimer = undefined;
            }
            existing.notifiers.push(notifyValue);
            if (existing.loaded) {
                // Already have the value — notify immediately without re-fetching
                notifyValue(existing.cached);
            }
            // If still loading, notifyValue will be called once the load completes
            return { unsubscribe: () => existing.unsubscribe(notifyValue) };
        }

        const sub: ObjectSubscription = {
            notifiers: [notifyValue],
            handler: null!,
            unsubscribe: null!,
            loaded: false,
            cached: undefined,
        };
        this.objectSubs.set(objectId, sub);

        sub.handler = (_id, obj) => {
            sub.cached = obj;
            for (const n of sub.notifiers) {
                n(obj);
            }
        };
        sub.unsubscribe = notifier => {
            const index = sub.notifiers.indexOf(notifier);
            if (index !== -1) {
                sub.notifiers.splice(index, 1);
            }
            if (sub.notifiers.length === 0 && !sub.lingerTimer && !this.destroyed) {
                sub.lingerTimer = setTimeout(() => {
                    sub.lingerTimer = undefined;
                    if (sub.notifiers.length === 0 && this.objectSubs.get(objectId) === sub) {
                        this.objectSubs.delete(objectId);
                        void this.socket.unsubscribeObject(objectId, sub.handler);
                    }
                }, UNSUBSCRIBE_GRACE_MS);
            }
            return Promise.resolve();
        };

        const obj = await this.socket.getObject(objectId);
        sub.cached = obj;
        sub.loaded = true;
        // Notify all notifiers (including any added while getObject was in progress)
        for (const n of sub.notifiers) {
            n(obj);
        }
        await this.socket.subscribeObject(objectId, sub.handler);
        return { unsubscribe: () => sub.unsubscribe(notifyValue) };
    }

    private async addStateListener<T extends ioBroker.StringOrTranslated | number | boolean>(
        stateId: string,
        mapping: Record<string | number, T> | undefined,
        callback: (value: T | undefined) => void,
    ): Promise<StateOrObjectSubscription> {
        const notifyValue = (state?: ioBroker.State | null): void => {
            let val = state?.val;
            if (val === undefined || val === null) {
                callback(undefined);
                return;
            }

            if (mapping) {
                if (typeof val === 'boolean') {
                    val = val.toString();
                }

                callback(mapping[val]);
            } else {
                callback(val as T);
            }
        };

        const existing = this.stateSubs.get(stateId);
        if (existing) {
            if (existing.lingerTimer) {
                // The subscription was about to be dropped - take it over instead
                clearTimeout(existing.lingerTimer);
                existing.lingerTimer = undefined;
            }
            existing.notifiers.push(notifyValue);
            if (existing.loaded) {
                // Already have the value — notify immediately without re-fetching
                notifyValue(existing.cached);
            }
            // If still loading, notifyValue will be called once the load completes
            return { unsubscribe: () => existing.unsubscribe(notifyValue) };
        }

        const sub: StateSubscription = {
            notifiers: [notifyValue],
            handler: null!,
            unsubscribe: null!,
            loaded: false,
            cached: undefined,
        };
        this.stateSubs.set(stateId, sub);

        sub.handler = (_id, state) => {
            sub.cached = state;
            for (const n of sub.notifiers) {
                n(state);
            }
        };
        sub.unsubscribe = notifier => {
            const index = sub.notifiers.indexOf(notifier);
            if (index !== -1) {
                sub.notifiers.splice(index, 1);
            }
            if (sub.notifiers.length === 0 && !sub.lingerTimer && !this.destroyed) {
                sub.lingerTimer = setTimeout(() => {
                    sub.lingerTimer = undefined;
                    if (sub.notifiers.length === 0 && this.stateSubs.get(stateId) === sub) {
                        this.stateSubs.delete(stateId);
                        this.socket.unsubscribeState(stateId, sub.handler);
                    }
                }, UNSUBSCRIBE_GRACE_MS);
            }
        };

        const state = await this.socket.getState(stateId);
        sub.cached = state;
        sub.loaded = true;
        // Notify all notifiers (including any added while the fetch was in progress)
        for (const n of sub.notifiers) {
            n(state);
        }
        await this.socket.subscribeState(stateId, sub.handler);
        return { unsubscribe: () => sub.unsubscribe(notifyValue) };
    }
}
