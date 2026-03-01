import type { Connection, IobTheme } from '@iobroker/adapter-react-v5';
import React, { type CSSProperties, type MouseEvent } from 'react';
import type { ActionBase, ConfigConnectionType, DeviceAction, DeviceId, DeviceStatus } from './protocol/api';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
export declare const ACTIONS: {
    STATUS: string;
    DISABLE: string;
    ENABLE: string;
};
export interface IconProps {
    /**  The width in pixels or percentage of the icon. */
    width?: number | string;
    /**  The height in pixels or percentage of the icon. */
    height?: number | string;
    /** Click handler. */
    onClick?: (e: MouseEvent) => void;
    /** The class name for the SVG element. */
    className?: string;
    /** Styles for the SVG element. */
    style?: CSSProperties;
    /** The font size of the icon. */
    fontSize?: 'small';
}
interface DeviceStatusProps {
    socket: Connection;
    status: DeviceStatus | null;
    deviceId: DeviceId;
    connectionType?: ConfigConnectionType;
    statusAction?: DeviceAction;
    enabled?: boolean;
    disableEnableAction?: DeviceAction;
    deviceHandler: (deviceId: DeviceId, action: ActionBase, refresh: () => void) => () => void;
    refresh: () => void;
    theme: IobTheme;
    stateOrObjectHandler: StateOrObjectHandler;
}
/**
 * Device Status component
 *
 * @param props - Parameters
 * @param props.status - Status object, e.g. { connection: 'connected', battery: 100, rssi: -50 }
 */
export default function DeviceStatus(props: DeviceStatusProps): React.JSX.Element | null;
export {};
