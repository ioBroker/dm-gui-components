import { getText } from './Utils';
/** The fields that are taken 1:1 from `DeviceInfo`, together with the transformation of their value */
const DIRECT_FIELDS = [
    { field: 'name', translated: true },
    { field: 'identifier' },
    { field: 'hasDetails' },
    { field: 'icon' },
    { field: 'backgroundColor' },
    { field: 'color' },
    { field: 'manufacturer', translated: true },
    { field: 'model', translated: true },
    { field: 'connectionType' },
    { field: 'enabled' },
];
export const EMPTY_FIELDS = {};
/** Extract the battery value (literal or state/object reference) from the device status */
function getBatteryItem(status) {
    if (!status || typeof status === 'string') {
        return undefined;
    }
    const list = Array.isArray(status) ? status : [status];
    for (const entry of list) {
        if (typeof entry !== 'string' && entry.battery !== undefined) {
            return entry.battery;
        }
    }
    return undefined;
}
/** A battery problem is an explicit battery warning (`false`) or a charge level below 30 % */
function isBatteryProblem(value) {
    if (value === false) {
        return true;
    }
    return typeof value === 'number' && value < 30;
}
/**
 * Resolves the filterable device fields of all devices of the list.
 *
 * All devices share a single `StateOrObjectHandler`, so several devices that refer to the same
 * object or state result in exactly one `getObject`/`subscribeObject` on the socket.
 */
export class DeviceFieldsResolver {
    handler;
    onChange;
    entries = new Map();
    notifyTimer = null;
    destroyed = false;
    /**
     * @param handler shared handler used for all subscriptions
     * @param onChange called (coalesced) whenever at least one resolved value changed
     */
    constructor(handler, onChange) {
        this.handler = handler;
        this.onChange = onChange;
    }
    /** Resolved values of one device. Never `undefined`, so the cards can rely on the object */
    getValues(key) {
        return this.entries.get(key)?.values || EMPTY_FIELDS;
    }
    /** All distinct, sorted model values found so far (used for the model filter dropdown) */
    getModels() {
        const models = new Set();
        for (const entry of this.entries.values()) {
            if (entry.values.model) {
                models.add(entry.values.model);
            }
        }
        return Array.from(models).sort();
    }
    /**
     * Synchronize the subscriptions with the given device list.
     *
     * Devices that disappeared are unsubscribed, new ones are subscribed and for the devices that
     * stayed only those fields are re-subscribed whose source actually changed. Literal values are
     * resolved synchronously, so right after this call the list can already filter on them.
     *
     * @param devices the devices with their (pre-computed) key
     */
    setDevices(devices) {
        if (this.destroyed) {
            return;
        }
        const keys = new Set();
        for (const { key, device } of devices) {
            keys.add(key);
            const entry = this.entries.get(key);
            if (entry) {
                entry.device = device;
                this.syncEntry(entry);
            }
            else {
                const newEntry = { device, values: {}, subscriptions: new Map() };
                this.entries.set(key, newEntry);
                this.syncEntry(newEntry);
            }
        }
        for (const [key, entry] of [...this.entries]) {
            if (!keys.has(key)) {
                this.entries.delete(key);
                this.disposeEntry(entry);
            }
        }
    }
    destroy() {
        this.destroyed = true;
        if (this.notifyTimer) {
            clearTimeout(this.notifyTimer);
            this.notifyTimer = null;
        }
        for (const entry of this.entries.values()) {
            this.disposeEntry(entry);
        }
        this.entries.clear();
    }
    /** (Re-)subscribe all fields of one device whose source changed */
    syncEntry(entry) {
        for (const { field, translated } of DIRECT_FIELDS) {
            this.syncField(entry, field, entry.device[field], translated);
        }
        this.syncField(entry, 'updateAvailable', entry.device.update?.available, false, value => !!value);
        this.syncField(entry, 'batteryProblem', getBatteryItem(entry.device.status), false, isBatteryProblem);
    }
    syncField(entry, field, source, translated, transform) {
        const existing = entry.subscriptions.get(field);
        if (existing) {
            if (existing.source === source) {
                // Nothing changed - keep the running subscription
                return;
            }
            entry.subscriptions.delete(field);
            this.disposeSubscription(existing);
        }
        const holder = { source, disposed: false };
        entry.subscriptions.set(field, holder);
        void this.handler
            .addListener(source, value => {
            if (holder.disposed) {
                return;
            }
            let resolved = value;
            if (transform) {
                resolved = transform(value);
            }
            else if (translated) {
                resolved = getText(value);
            }
            if (entry.values[field] === resolved) {
                return;
            }
            // Replace the object instead of mutating it, so `DeviceCard` (a `PureComponent`)
            // notices the change by a simple reference comparison
            entry.values = { ...entry.values, [field]: resolved };
            this.scheduleNotify();
        })
            .then(subscription => {
            holder.subscription = subscription;
            if (holder.disposed) {
                void subscription.unsubscribe();
            }
        })
            .catch(error => console.error(`Cannot subscribe to "${field}":`, error));
    }
    disposeEntry(entry) {
        for (const subscription of entry.subscriptions.values()) {
            this.disposeSubscription(subscription);
        }
        entry.subscriptions.clear();
    }
    // eslint-disable-next-line class-methods-use-this
    disposeSubscription(holder) {
        holder.disposed = true;
        void holder.subscription?.unsubscribe();
    }
    /**
     * Values arrive one by one - a single device already produces a dozen callbacks. Without this
     * throttle every one of them would re-render the complete list.
     */
    scheduleNotify() {
        if (this.notifyTimer || this.destroyed) {
            return;
        }
        this.notifyTimer = setTimeout(() => {
            this.notifyTimer = null;
            if (!this.destroyed) {
                this.onChange();
            }
        }, 50);
    }
}
//# sourceMappingURL=DeviceFields.js.map