import React, { type JSX } from 'react';
import type { DeviceInfo, InstanceDetails } from './protocol/api';
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
    instanceInfo: InstanceDetails | null;
    loading: boolean | null;
    alive: boolean | null;
    triggerLoad: number;
    groupKey: string;
    dmInstances: {
        [instanceName: string]: {
            title: string;
            instance: number;
        };
    } | null;
    apiVersionError: boolean;
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
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    aliveHandler: ioBroker.StateChangeHandler;
    /**
     * Load devices
     */
    loadData(): void;
    getText(text: ioBroker.StringOrTranslated): string;
    handleFilterChange(filter: string): void;
    renderGroups(groups: {
        name: string;
        value: string;
        count: number;
        icon?: React.JSX.Element | string | null;
    }[] | undefined): React.JSX.Element | null;
    renderContent(): JSX.Element | JSX.Element[] | null;
}
export {};
