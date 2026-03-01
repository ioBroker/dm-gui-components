export class StateOrObjectHandler {
    socket;
    objectSubs = new Map();
    stateSubs = new Map();
    constructor(socket) {
        this.socket = socket;
    }
    async addListener(item, callback) {
        if (item === undefined) {
            callback(undefined);
            return;
        }
        if (typeof item !== 'object') {
            callback(item);
            return;
        }
        if ('en' in item) {
            callback(item);
            return;
        }
        try {
            if ('objectId' in item) {
                const notifyValue = (obj) => {
                    if (!obj) {
                        callback(undefined);
                        return;
                    }
                    const parts = item.property.split('.');
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
                const sub = {
                    notifiers: [notifyValue],
                    handler: null,
                    loaded: false,
                    cached: undefined,
                };
                this.objectSubs.set(item.objectId, sub);
                const handler = (_id, obj) => {
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
                const notifyValue = (state) => {
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
                    }
                    else {
                        callback(val);
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
                const sub = {
                    notifiers: [notifyValue],
                    handler: null,
                    loaded: false,
                    cached: undefined,
                };
                this.stateSubs.set(item.stateId, sub);
                const handler = (_id, state) => {
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
        }
        catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }
        callback(undefined);
    }
    async unsubscribe() {
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
//# sourceMappingURL=StateOrObjectHandler.js.map