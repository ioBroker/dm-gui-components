import type { ConfigConnectionType, DeviceInfo } from './protocol/api';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
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
export declare const EMPTY_FIELDS: ResolvedDeviceFields;
/**
 * Resolves the filterable device fields of all devices of the list.
 *
 * All devices share a single `StateOrObjectHandler`, so several devices that refer to the same
 * object or state result in exactly one `getObject`/`subscribeObject` on the socket.
 */
export declare class DeviceFieldsResolver {
    private readonly handler;
    private readonly onChange;
    private readonly entries;
    private notifyTimer;
    private destroyed;
    /**
     * @param handler shared handler used for all subscriptions
     * @param onChange called (coalesced) whenever at least one resolved value changed
     */
    constructor(handler: StateOrObjectHandler, onChange: () => void);
    /** Resolved values of one device. Never `undefined`, so the cards can rely on the object */
    getValues(key: string): ResolvedDeviceFields;
    /** All distinct, sorted model values found so far (used for the model filter dropdown) */
    getModels(): string[];
    /**
     * Synchronize the subscriptions with the given device list.
     *
     * Devices that disappeared are unsubscribed, new ones are subscribed and for the devices that
     * stayed only those fields are re-subscribed whose source actually changed. Literal values are
     * resolved synchronously, so right after this call the list can already filter on them.
     *
     * @param devices the devices with their (pre-computed) key
     */
    setDevices(devices: {
        key: string;
        device: DeviceInfo;
    }[]): void;
    destroy(): void;
    /** (Re-)subscribe all fields of one device whose source changed */
    private syncEntry;
    private syncField;
    private disposeEntry;
    private disposeSubscription;
    /**
     * Values arrive one by one - a single device already produces a dozen callbacks. Without this
     * throttle every one of them would re-render the complete list.
     */
    private scheduleNotify;
}
