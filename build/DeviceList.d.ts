import React, { type JSX } from 'react';
import type { DeviceId, DeviceInfo, InstanceDetails } from './protocol/api';
import { type DeviceFilterField } from './DeviceCard';
import Communication, { type CommunicationProps, type CommunicationState } from './Communication';
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
    /** Resolved model value per device (stringified id -> model), reported by the cards to build the model dropdown */
    private readonly modelValues;
    private readonly language;
    /** Subscriptions for the instance-wide indicators in the toolbar */
    private readonly stateOrObjectHandler;
    constructor(props: DeviceListProps);
    setStateAsync(state: Partial<DeviceListState>): Promise<void>;
    private loadAdapters;
    private selectInstance;
    private backToInstancesList;
    private refreshInstanceList;
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    aliveHandler: ioBroker.StateChangeHandler;
    loadAllData(): Promise<void>;
    loadInstanceInfos(): Promise<InstanceDetails>;
    /**
     * Load devices
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
    /** Collects the resolved model values reported by the cards and keeps the distinct, sorted list in state */
    private reportModel;
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
