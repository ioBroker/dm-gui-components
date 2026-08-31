const emptySubscription = {
    unsubscribe: () => { },
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
    socket;
    objectSubs = new Map();
    stateSubs = new Map();
    destroyed = false;
    constructor(socket) {
        this.socket = socket;
    }
    /** Unsubscribe everything. To be called when the component owning this handler is unmounted */
    destroy() {
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
    async addListener(item, callback) {
        if (item === undefined) {
            callback(undefined);
            return emptySubscription;
        }
        if (typeof item !== 'object') {
            callback(item);
            return emptySubscription;
        }
        if ('en' in item) {
            callback(item);
            return emptySubscription;
        }
        try {
            if ('objectId' in item) {
                return this.addObjectListener(item.objectId, item.property, callback);
            }
            if ('stateId' in item) {
                return this.addStateListener(item.stateId, item.mapping, callback);
            }
        }
        catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }
        callback(undefined);
        return emptySubscription;
    }
    async addObjectListener(objectId, property, callback) {
        const notifyValue = (obj) => {
            if (!obj) {
                callback(undefined);
                return;
            }
            const parts = property.split('.');
            let current = obj;
            for (const part of parts) {
                if (current[part] === undefined) {
                    callback(undefined);
                    return;
                }
                current = current[part];
            }
            callback(current);
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
        const sub = {
            notifiers: [notifyValue],
            handler: null,
            unsubscribe: null,
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
    async addStateListener(stateId, mapping, callback) {
        const notifyValue = (state) => {
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
            }
            else {
                callback(val);
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
        const sub = {
            notifiers: [notifyValue],
            handler: null,
            unsubscribe: null,
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
//# sourceMappingURL=StateOrObjectHandler.js.map