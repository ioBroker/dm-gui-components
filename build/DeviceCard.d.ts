import { type Connection, type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';
import React, { Component, type JSX } from 'react';
import type { ActionBase, ControlBase, ControlState, DeviceDetails, DeviceInfo, DeviceId, ConfigConnectionType } from './protocol/api';
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
}
/**
 * Device Card Component
 */
export default class DeviceCard extends Component<DeviceCardProps, DeviceCardState> {
    private readonly stateOrObjectHandler;
    private readonly subscriptions;
    constructor(props: DeviceCardProps);
    fetchIcon(): Promise<void>;
    componentDidMount(): Promise<void>;
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
