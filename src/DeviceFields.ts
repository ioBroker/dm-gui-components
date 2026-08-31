import type { ValueOrStateOrObject } from '@iobroker/dm-utils';

import type { ConfigConnectionType, DeviceInfo, DeviceStatus } from './protocol/api';
import type { StateOrObjectHandler, StateOrObjectSubscription } from './StateOrObjectHandler';
import { getText } from './Utils';

/**
 * The device fields that may be bound to a state or an object and that the list has to know about,
 * because they are used for filtering and for the header of a card.
 *
 * They are resolved centrally in `DeviceList` instead of inside every `DeviceCard`: a card that is
 * not mounted (because it is filtered out or scrolled far out of the viewport) cannot resolve its
 * own name, and the filter would have nothing to work with.
 */
export interface ResolvedDeviceFields {
    name?: string;
    identifier?: string;
    hasDetails?: boolean;
    icon?: string;
    backgroundColor?: string;
    color?: string;
    manufacturer?: string;
    model?: string;
    connectionType?: ConfigConnectionType;
    enabled?: boolean;
    /** Resolved from `device.update.available` */
    updateAvailable?: boolean;
    /** Derived from the battery entry of `device.status` */
    batteryProblem?: boolean;
}

/** Device fields that can be used for the text filter */
export type DeviceFilterField = 'name' | 'identifier' | 'manufacturer' | 'model';

/** The fields that are taken 1:1 from `DeviceInfo`, together with the transformation of their value */
const DIRECT_FIELDS: { field: keyof ResolvedDeviceFields & keyof DeviceInfo; translated?: boolean }[] = [
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

export const EMPTY_FIELDS: ResolvedDeviceFields = {};

/** Any device field: a literal value or a reference to a state or an object */
type DeviceFieldSource = ValueOrStateOrObject<ioBroker.StringOrTranslated | number | boolean>;

/** Extract the battery value (literal or state/object reference) from the device status */
function getBatteryItem(status: DeviceInfo['status']): Extract<DeviceStatus, object>['battery'] {
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
function isBatteryProblem(value: number | boolean | string | undefined): boolean {
    if (value === false) {
        return true;
    }
    return typeof value === 'number' && value < 30;
}

/**
 * One subscription of one field.
 *
 * `StateOrObjectHandler.addListener` is asynchronous, so the subscription may arrive after the field
 * was already replaced or the device was removed. `disposed` makes both cases safe.
 */
interface FieldSubscription {
    /** The `ValueOrStateOrObject` this subscription was created for; used to detect a changed source */
    source: unknown;
    subscription?: StateOrObjectSubscription;
    disposed: boolean;
}

interface DeviceEntry {
    device: DeviceInfo;
    /** Replaced (never mutated) on every change, so the cards can compare it by reference */
    values: ResolvedDeviceFields;
    subscriptions: Map<keyof ResolvedDeviceFields, FieldSubscription>;
}

/**
 * Resolves the filterable device fields of all devices of the list.
 *
 * All devices share a single `StateOrObjectHandler`, so several devices that refer to the same
 * object or state result in exactly one `getObject`/`subscribeObject` on the socket.
 */
export class DeviceFieldsResolver {
    private readonly entries = new Map<string, DeviceEntry>();

    private notifyTimer: ReturnType<typeof setTimeout> | null = null;

    private destroyed = false;

    /**
     * @param handler shared handler used for all subscriptions
     * @param onChange called (coalesced) whenever at least one resolved value changed
     */
    constructor(
        private readonly handler: StateOrObjectHandler,
        private readonly onChange: () => void,
    ) {}

    /** Resolved values of one device. Never `undefined`, so the cards can rely on the object */
    public getValues(key: string): ResolvedDeviceFields {
        return this.entries.get(key)?.values || EMPTY_FIELDS;
    }

    /** All distinct, sorted model values found so far (used for the model filter dropdown) */
    public getModels(): string[] {
        const models = new Set<string>();
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
    public setDevices(devices: { key: string; device: DeviceInfo }[]): void {
        if (this.destroyed) {
            return;
        }

        const keys = new Set<string>();
        for (const { key, device } of devices) {
            keys.add(key);
            const entry = this.entries.get(key);
            if (entry) {
                entry.device = device;
                this.syncEntry(entry);
            } else {
                const newEntry: DeviceEntry = { device, values: {}, subscriptions: new Map() };
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

    public destroy(): void {
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
    private syncEntry(entry: DeviceEntry): void {
        for (const { field, translated } of DIRECT_FIELDS) {
            this.syncField(entry, field, entry.device[field], translated);
        }
        this.syncField(entry, 'updateAvailable', entry.device.update?.available, false, value => !!value);
        this.syncField(entry, 'batteryProblem', getBatteryItem(entry.device.status), false, isBatteryProblem);
    }

    private syncField(
        entry: DeviceEntry,
        field: keyof ResolvedDeviceFields,
        source: DeviceFieldSource | undefined,
        translated?: boolean,
        transform?: (value: any) => any,
    ): void {
        const existing = entry.subscriptions.get(field);
        if (existing) {
            if (existing.source === source) {
                // Nothing changed - keep the running subscription
                return;
            }
            entry.subscriptions.delete(field);
            this.disposeSubscription(existing);
        }

        const holder: FieldSubscription = { source, disposed: false };
        entry.subscriptions.set(field, holder);

        void this.handler
            .addListener(source, value => {
                if (holder.disposed) {
                    return;
                }
                let resolved: any = value;
                if (transform) {
                    resolved = transform(value);
                } else if (translated) {
                    resolved = getText(value as ioBroker.StringOrTranslated | undefined);
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

    private disposeEntry(entry: DeviceEntry): void {
        for (const subscription of entry.subscriptions.values()) {
            this.disposeSubscription(subscription);
        }
        entry.subscriptions.clear();
    }

    // eslint-disable-next-line class-methods-use-this
    private disposeSubscription(holder: FieldSubscription): void {
        holder.disposed = true;
        void holder.subscription?.unsubscribe();
    }

    /**
     * Values arrive one by one - a single device already produces a dozen callbacks. Without this
     * throttle every one of them would re-render the complete list.
     */
    private scheduleNotify(): void {
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
