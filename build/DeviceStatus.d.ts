import type { Connection, IobTheme } from '@iobroker/gui-components';
import React, { type CSSProperties, type MouseEvent } from 'react';
import type { ActionBase, ConfigConnectionType, DeviceAction, DeviceId, DeviceInfo, DeviceStatus } from './protocol/api';
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
    /** Update information of the device (firmware/software) */
    update?: DeviceInfo['update'];
    /** Reserved "update" action. If provided, the update indicator becomes a clickable button */
    updateAction?: DeviceAction;
    /** Reserved "battery" action. If provided, the battery indicator becomes a clickable button */
    batteryAction?: DeviceAction;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    theme: IobTheme;
    stateOrObjectHandler: StateOrObjectHandler;
}
/**
 * Device Status component: connection, signal, battery, warning and update as pills of the status line.
 *
 * A pill is neutral while the value is fine and tinted with its color when it needs attention, so that
 * the problems stand out in a list of many devices.
 *
 * @param props - Parameters
 * @param props.status - Status object, e.g. { connection: 'connected', battery: 100, rssi: -50 }
 */
export default function DeviceStatusComponent(props: DeviceStatusProps): React.JSX.Element | null;
interface DeviceLedProps {
    status?: DeviceStatus | null;
    stateOrObjectHandler: StateOrObjectHandler;
    /** The instance runs. If not, the LED is grey. */
    alive: boolean;
    /** The device is switched off: the LED is grey */
    enabled?: boolean;
}
/**
 * The LED on the device symbol: green while the device is connected, red without connection.
 *
 * It sends a pulse each time the device reports a new signal strength, like the LED of a real device
 * that blinks on traffic. Nothing is shown while the connection is unknown.
 */
export declare function DeviceLed(props: DeviceLedProps): React.JSX.Element | null;
export {};
