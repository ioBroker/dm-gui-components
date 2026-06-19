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
}
/**
 * Device List Component
 */
export default class DeviceList extends Communication<DeviceListProps, DeviceListState> {
    static i18nInitialized: boolean;
    private lastInstance;
    private lastAliveSubscribe;
    private lastTriggerLoad;
    private filterTimeout;
    private readonly language;
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
    /** The selected filter field, falling back to `name` if the stored field is not present on any current device */
    private getEffectiveFilterField;
    renderFilterFields(): React.JSX.Element | null;
    renderRootInfo(): React.JSX.Element;
    renderContent(): JSX.Element | JSX.Element[] | null;
}
export {};
