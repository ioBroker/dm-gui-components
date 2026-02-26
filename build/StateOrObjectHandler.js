export class StateOrObjectHandler {
    socket;
    unsubscribes = [];
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
                const obj = await this.socket.getObject(item.objectId);
                notifyValue(obj);
                const handler = (_id, obj) => notifyValue(obj);
                await this.socket.subscribeObject(item.objectId, handler);
                this.unsubscribes.push(() => this.socket.unsubscribeObject(item.objectId, handler));
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
                const state = await this.socket.getState(item.stateId);
                notifyValue(state);
                const handler = (_id, state) => notifyValue(state);
                await this.socket.subscribeState(item.stateId, handler);
                this.unsubscribes.push(() => this.socket.unsubscribeState(item.stateId, handler));
                return;
            }
        }
        catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }
        callback(undefined);
    }
    async unsubscribe() {
        for (const unsubscribe of this.unsubscribes) {
            await unsubscribe();
        }
        this.unsubscribes.length = 0;
    }
}
//# sourceMappingURL=StateOrObjectHandler.js.map