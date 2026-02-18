import type { Connection, ObjectChangeHandler } from '@iobroker/adapter-react-v5';
import type { RetVal, ValueOrStateOrObject } from '@iobroker/dm-utils';

export class StateOrObjectHandler {
    private readonly unsubscribes: (() => RetVal<void>)[] = [];

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

                const obj = await this.socket.getObject(item.objectId);
                notifyValue(obj);
                const handler: ObjectChangeHandler = (_id, obj) => notifyValue(obj);
                await this.socket.subscribeObject(item.objectId, handler);
                this.unsubscribes.push(() => this.socket.unsubscribeObject(item.objectId, handler));
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

                const state = await this.socket.getState(item.stateId);
                notifyValue(state);
                const handler: ioBroker.StateChangeHandler = (_id, state) => notifyValue(state);
                await this.socket.subscribeState(item.stateId, handler);
                this.unsubscribes.push(() => this.socket.unsubscribeState(item.stateId, handler));
                return;
            }
        } catch (error) {
            console.error('Error in StateOrObjectHandler:', item, error);
        }

        callback(undefined);
    }

    public async unsubscribe(): Promise<void> {
        for (const unsubscribe of this.unsubscribes) {
            await unsubscribe();
        }

        this.unsubscribes.length = 0;
    }
}
