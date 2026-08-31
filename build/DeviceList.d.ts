import React, { type JSX } from 'react';
import type { DeviceId, DeviceInfo, InstanceDetails } from './protocol/api';
import Communication, { type CommunicationProps, type CommunicationState } from './Communication';
import { type DeviceFilterField } from './DeviceFields';
interface DeviceListProps extends CommunicationProps {
    /** Instance to upload images to, like `adapterName.X` */
    uploadImagesToInstance?: string;
    /** Filter devices with this string */
    filter?: string;
    /** If this component is used in GUI with own toolbar. `false` if this list is used with multiple instances and true if only with one (in this case, it will monitor alive itself */
    embedded?: boolean;
    /** If embedded, this text is shown in the toolbar */
    title?: string;
    /** Style of a component that displays all devices */
    style?: React.CSSProperties;
    /** Use small cards for devices */
    smallCards?: boolean;
    /** To trigger the reload of devices, just change this variable */
    triggerLoad?: number;
}
interface DeviceListState extends CommunicationState {
    devices: DeviceInfo[];
    totalDevices?: number;
    filter: string;
    filterText: string;
    instanceInfo: InstanceDetails | null;
    loading: boolean | null;
    alive: boolean | null;
    triggerLoad: number;
    groupKey: string;
    dmInstances: {
        [instanceName: string]: {
            title: string;
            icon: string;
            instance: number;
        };
    } | null;
    apiVersionError: boolean;
    /** Show only devices that have an available update */
    onlyUpdatable: boolean;
    /** Show only devices that have a battery problem */
    onlyBatteryProblem: boolean;
    /** Device field the text filter applies to */
    filterField: DeviceFilterField;
    /** Distinct resolved model values across the loaded devices (for the model filter dropdown) */
    modelOptions: string[];
    /** Visibility of the configurable indicators, as explicitly chosen by the user for this instance */
    indicatorVisibility: Record<string, boolean>;
    /** Anchor of the indicator visibility menu */
    indicatorsAnchor: HTMLElement | null;
    /** Increased whenever a device field bound to a state or an object changed, to trigger a re-render */
    fieldsVersion: number;
}
/**
 * Device List Component
 */
export default class DeviceList extends Communication<DeviceListProps, DeviceListState> {
    static i18nInitialized: boolean;
    private lastInstance;
    private lastAliveSubscribe;
    /**
     * Synchronous mirror of `state.alive`. `setState` is asynchronous, so the guard in `aliveHandler`
     * cannot rely on `state.alive` being committed yet when `subscribeState` replays the current value.
     * This field is always updated synchronously together with `setState({ alive })` and is the source
     * of truth for the "did alive actually change?" check, which prevents the double device load.
     */
    private alive;
    private lastTriggerLoad;
    private filterTimeout;
    private readonly language;
    /**
     * One handler for the toolbar indicators and for all cards, so that several devices referring to
     * the same object or state share a single subscription on the socket.
     */
    private readonly stateOrObjectHandler;
    /** Resolves the device fields that may be bound to a state or an object (name, model, ...) */
    private readonly fieldsResolver;
    /** One `IntersectionObserver` for all cards: only what is near the viewport is really rendered */
    private readonly lazyObserver;
    /** The scrolling container of the card list; it is the root of `lazyObserver` */
    private readonly containerRef;
    /** A load is running. A second one must not tear down the same list in parallel */
    private loadingDevices;
    /** A load was requested while another one was still running */
    private reloadRequested;
    /** Devices of the running initial load that are not published to the state yet */
    private pendingDevices;
    private pendingTotal;
    private flushTimer;
    /** Memoized result of `getHiddenIndicators`, so that all cards keep getting the same array */
    private hiddenIndicatorsCache;
    constructor(props: DeviceListProps);
    setStateAsync(state: Partial<DeviceListState>): Promise<void>;
    private loadAdapters;
    private selectInstance;
    private backToInstancesList;
    private refreshInstanceList;
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    /**
     * The side effects that used to be triggered from `render()`. A render must not have any, and
     * the `setTimeout` there was executed on every single render.
     */
    componentDidUpdate(): void;
    /**
     * A value bound to a state or an object arrived. The cards are `PureComponent`s and receive the
     * values through their `fields` property, so the list only has to trigger a re-render.
     */
    private onFieldsChanged;
    /**
     * Publish a new device list.
     *
     * The resolver is updated *before* the state, because it resolves literal values synchronously -
     * the cards and the filter therefore already have their values on the very first render.
     */
    private applyDevices;
    /**
     * Publish the devices loaded so far, but at most every 100 ms: a fast backend delivers a dozen
     * batches in a row, and every single one of them would otherwise re-render the complete list.
     */
    private scheduleDeviceFlush;
    private cancelDeviceFlush;
    aliveHandler: ioBroker.StateChangeHandler;
    loadAllData(): Promise<void>;
    loadInstanceInfos(): Promise<InstanceDetails>;
    /**
     * Load devices.
     *
     * The list is deliberately *not* emptied first: as long as the keys stay the same React keeps the
     * existing cards, so a reload - the matter adapter triggers one on every `updateController`
     * message - no longer unmounts and remounts a few hundred cards with all their subscriptions.
     */
    loadDeviceList(): void;
    updateDevice(update: DeviceInfo): void;
    deleteDevice(deviceId: DeviceId): void;
    getText(text: ioBroker.StringOrTranslated): string;
    handleFilterChange(filter: string): void;
    renderGroups(groups: {
        name: string;
        value: string;
        count: number;
        icon?: React.JSX.Element | string | null;
    }[] | undefined): React.JSX.Element | null;
    renderInstanceCards(): React.JSX.Element[];
    /**
     * Apply the text filter and the "only updatable" / "only battery problem" filters.
     *
     * This used to be done by every card for itself. A filtered out card stayed mounted with all its
     * subscriptions and only rendered nothing, so filtering did not reduce the load at all - and a
     * card that is not rendered cannot filter itself in the first place.
     */
    private filterDevices;
    /** The selected filter field, falling back to `name` if the stored field is not available (e.g. no models found) */
    private getEffectiveFilterField;
    renderFilterFields(): React.JSX.Element | null;
    /** The filter value input: a model dropdown for the `model` field, a free-text field otherwise */
    renderFilterValue(): React.JSX.Element;
    renderRootInfo(): React.JSX.Element;
    /** Key of the stored indicator visibility of one instance */
    private static indicatorStorageKey;
    /** Read the visibility the user has explicitly chosen for the configurable indicators of an instance */
    private static loadIndicatorVisibility;
    /**
     * All configurable indicators of the instance and of the loaded devices, unique by ID.
     * Indicators with the same ID on different devices are configured together.
     */
    private getConfigurableIndicators;
    /** True if the given configurable indicator is currently shown */
    private isIndicatorVisible;
    /** IDs of the configurable indicators the user has switched off */
    private getHiddenIndicators;
    private toggleIndicator;
    /** The toolbar button that lets the user show or hide the configurable indicators */
    renderIndicatorSettings(): JSX.Element | null;
    /** Resolve how an instance indicator behaves on click by looking up the referenced instance action */
    private resolveInstanceIndicatorAction;
    /** Instance actions in the toolbar. An action referenced by an indicator is not rendered twice */
    renderInstanceActions(): JSX.Element | null;
    renderContent(): JSX.Element | JSX.Element[] | null;
}
export {};
