import React, { Component, type JSX } from 'react';
import { type Connection, type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';
import type { ActionBase, ControlBase, ControlState, DeviceDetails, DeviceControl, DeviceInfo, DeviceId, ConfigConnectionType } from './protocol/api';
/** Device fields that can be used for the text filter */
export type DeviceFilterField = 'name' | 'identifier' | 'manufacturer' | 'model';
interface DeviceCardProps {
    filter?: string;
    id: DeviceId;
    identifierLabel: ioBroker.StringOrTranslated;
    device: DeviceInfo;
    instanceId: string;
    socket: Connection;
    uploadImagesToInstance?: string;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    controlHandler: (deviceId: DeviceId, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;
    controlStateHandler: (deviceId: DeviceId, control: ControlBase) => () => Promise<ioBroker.State | null>;
    smallCards?: boolean;
    alive: boolean;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
    /** If true, only devices that have an available update are shown */
    onlyUpdatable?: boolean;
    /** If true, only devices that have a battery problem (empty/low battery) are shown */
    onlyBatteryProblem?: boolean;
    /** Device field the text filter applies to. Default `name` */
    filterField?: DeviceFilterField;
}
interface DeviceCardState {
    open: boolean;
    details: DeviceDetails | null;
    data: Record<string, any>;
    showControlDialog: boolean;
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
    updateAvailable?: boolean;
    batteryProblem?: boolean;
}
/**
 * Device Card Component
 */
export default class DeviceCard extends Component<DeviceCardProps, DeviceCardState> {
    private readonly stateOrObjectHandler;
    private readonly subscriptions;
    /** Separate subscription for the nested `device.update.available` field (used for the update indicator and the "only updatable" filter) */
    private updateAvailableSubscription?;
    /** Separate subscription for the nested battery status (used for the "battery problem" filter) */
    private batteryProblemSubscription?;
    constructor(props: DeviceCardProps);
    fetchIcon(): Promise<void>;
    componentDidMount(): Promise<void>;
    private subscribeUpdateAvailable;
    /** Extract the battery value (literal or state/object reference) from the device status */
    private getBatteryItem;
    /** A battery problem is an explicit battery warning (`false`) or a charge level below 30 % */
    private static isBatteryProblem;
    private subscribeBatteryProblem;
    private addStateOrObjectListener;
    componentDidUpdate(prevProps: DeviceCardProps): Promise<void>;
    componentWillUnmount(): Promise<void>;
    /**
     * Load the device details
     */
    loadDetails(): Promise<void>;
    /**
     * Copy the device ID to the clipboard
     */
    copyToClipboard: () => void;
    renderDialog(): JSX.Element | null;
    renderControlItems(controls: DeviceControl[], allControls: DeviceControl[], colors: {
        primary: string;
        secondary: string;
    }, parentGroupId?: string): JSX.Element[];
    renderControlDialog(): JSX.Element | null;
    renderControls(): JSX.Element | null;
    renderActions(): JSX.Element[] | null;
    renderSmall(): JSX.Element;
    getCardHeaderStyle(theme: IobTheme, maxWidth?: number): React.CSSProperties;
    renderBig(): JSX.Element;
    render(): JSX.Element;
}
type DeviceCardSkeletonProps = Pick<DeviceCardProps, 'smallCards' | 'theme'>;
export declare class DeviceCardSkeleton extends Component<DeviceCardSkeletonProps> {
    render(): JSX.Element;
    renderSmall(): JSX.Element;
    renderBig(): JSX.Element;
    getCardHeaderStyle(theme: IobTheme, maxWidth?: number): React.CSSProperties;
}
export {};
