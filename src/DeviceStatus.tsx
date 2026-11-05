import { I18n, IconConnectionState, IconStatusLed } from '@iobroker/gui-components';
import type { Connection, IobTheme } from '@iobroker/gui-components';
import {
    Bluetooth as IconConnectionBluetooth,
    Cable as IconConnectionLan,
    BluetoothDisabled as IconConnectionNoBluetooth,
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import React, { useState, type CSSProperties, type MouseEvent } from 'react';

import { IconBattery, IconSignal, IconUpdate, useValueTick } from './AnimatedIcons';
import { useStateOrObject } from './hooks';
import type {
    ActionBase,
    ConfigConnectionType,
    DeviceAction,
    DeviceId,
    DeviceInfo,
    DeviceStatus,
} from './protocol/api';
import StatusPill from './StatusPill';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
import { getTranslation } from './Utils';

export const ACTIONS = {
    STATUS: 'status',
    DISABLE: 'disable',
    ENABLE: 'enable',
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

function ThreadIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 165 165"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M82.498,0C37.008,0,0,37.008,0,82.496c0,45.181,36.51,81.977,81.573,82.476V82.569l-27.002-0.002  c-8.023,0-14.554,6.53-14.554,14.561c0,8.023,6.531,14.551,14.554,14.551v17.98c-17.939,0-32.534-14.595-32.534-32.531  c0-17.944,14.595-32.543,32.534-32.543l27.002,0.004v-9.096c0-14.932,12.146-27.08,27.075-27.08  c14.932,0,27.082,12.148,27.082,27.08c0,14.931-12.15,27.08-27.082,27.08l-9.097-0.001v80.641  C136.889,155.333,165,122.14,165,82.496C165,37.008,127.99,0,82.498,0z"
            />
            <path
                fill="currentColor"
                d="M117.748,55.493c0-5.016-4.082-9.098-9.1-9.098c-5.015,0-9.097,4.082-9.097,9.098v9.097l9.097,0.001  C113.666,64.591,117.748,60.51,117.748,55.493z"
            />
        </svg>
    );
}

function ZWaveIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 1073 1068"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M716 1.1C632.9 5.3 549.8 23.7 472 55c-66.4 26.7-132.6 65.5-188.5 110.4-43.8 35.1-85.2 76.7-120.1 120.6C72.4 400.4 16.7 539.8 3.5 686 1.8 705.1-.1 754.7.7 758c.5 2 1 2 49.7 1.8l49.1-.3.7-20c2.4-64.6 13.4-126 33.2-186 80.8-243.9 297-419.9 552.1-449.4 20.2-2.4 44.2-4.1 56.6-4.1h8.9V50 0l-9.7.1c-5.4.1-16.8.6-25.3 1zm-.8 208c-78.5 4.7-158 27.4-226.5 64.5-68.7 37.3-126.4 86.3-175.2 148.9-11 14-33.2 47.3-42.3 63.5-44 77.8-68.6 164.9-70.9 251.2l-.6 22.8h49.5 49.4l1.2-19c6.3-98.7 40-185.8 102.2-263.3 12.7-15.9 41.2-45.2 57-58.7 66.1-56.3 142.1-91.8 226-105.5 18.9-3 44.1-5.5 56.7-5.5h9.3v-50-50l-11.2.1c-6.2.1-17.3.6-24.6 1zm17.8 251c-104.5 9.2-195.2 69.7-243.6 162.4-43.9 84-45.5 184.2-4.5 270 60.3 125.9 198.1 194.2 334.9 166 46.6-9.7 89.5-29.7 127.2-59.6 13.5-10.7 37.3-34.5 48-47.9 34.2-43.1 55.2-92 63.7-148.6 2.2-15.1 2.5-62.7.5-77.4-3.6-25.2-10.1-51.4-17.8-71.2-10.1-26.2-29.4-59.7-47-81.8-9.7-12.1-35-37.2-47.4-47-47.8-37.9-104.5-60.1-165.4-65-14.7-1.1-34.7-1.1-48.6.1zm174.7 138.6c-.3.5-30.9 49.2-68.1 108.3L772 814.5l67.9.5 68 .5-30.1 48.8-30 48.7h-131c-104.4 0-130.9-.3-130.5-1.3.2-.6 32.7-51.1 72.1-112.1L730 687.9c0-.5-29.5-1-66.5-1.1l-66.6-.3 27.7-44.3 27.6-44.2h128l127.5.7z"
            />
        </svg>
    );
}

function ZigBeeIcon(props: IconProps): React.JSX.Element {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            onClick={e => props.onClick && props.onClick(e)}
            viewBox="0 0 48 48"
            width={props.width || (props.fontSize === 'small' ? 16 : 20)}
            height={props.height || props.width || (props.fontSize === 'small' ? 16 : 20)}
            className={props.className}
            style={props.style}
        >
            <path
                fill="currentColor"
                d="M32.042,9.792c4.595,1.238,4.88,3.165,5.524,5.048C34.841,17.664,17.35,35.7,17.35,35.7 s10.901,1.177,23.487-1.003c-0.001,0.029-0.002,0.048-0.003,0.076C42.829,31.661,44,27.97,44,24c0-11.046-8.954-20-20-20 c-5.634,0-10.715,2.338-14.35,6.087C15.489,9.124,26.89,8.403,32.042,9.792z"
            />
            <path
                fill="currentColor"
                d="M14.724,37.285c-1.982-0.347-4.212-2.131-4.707-5.302c1.437-1.239,19.994-20.507,19.994-20.507 c-7.008-0.424-14.569-0.465-22.237,0.864C5.408,15.625,4,19.644,4,24c0,11.046,8.954,20,20,20c6.173,0,11.689-2.8,15.358-7.195 C35.486,37.33,23.257,38.769,14.724,37.285z"
            />
        </svg>
    );
}

/** The status as an object, also if the device gives only the connection as a string */
function normalizeStatus(status: DeviceStatus | null | undefined): Exclude<DeviceStatus, string> {
    if (!status) {
        return {};
    }
    if (typeof status === 'string') {
        return { connection: status };
    }
    return status;
}

/** The symbol of the connection type; `null` if there is nothing to show */
function getConnectionSymbol(
    connectionType: ConfigConnectionType | undefined,
    connection: string | undefined,
): React.JSX.Element | null {
    const disconnected = connection === 'disconnected';
    switch (connectionType) {
        case 'wifi':
            // The waves are crossed out when the connection is lost
            return <IconConnectionState state={disconnected ? 'disconnected' : 'connected'} />;
        case 'bluetooth':
            return disconnected ? <IconConnectionNoBluetooth /> : <IconConnectionBluetooth />;
        case 'lan':
            return <IconConnectionLan />;
        case 'thread':
            return <ThreadIcon />;
        case 'z-wave':
            return <ZWaveIcon />;
        case 'zigbee':
            return <ZigBeeIcon />;
        default:
            if (connection === 'connected') {
                return <LinkIcon />;
            }
            return disconnected ? <LinkOffIcon /> : null;
    }
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
export default function DeviceStatusComponent(props: DeviceStatusProps): React.JSX.Element | null {
    const status = normalizeStatus(props.status);

    const connection = useStateOrObject(status.connection, props.stateOrObjectHandler);
    const rssi = useStateOrObject(status.rssi, props.stateOrObjectHandler);
    const battery = useStateOrObject(status.battery, props.stateOrObjectHandler);
    const warning = useStateOrObject(status.warning, props.stateOrObjectHandler);
    const updateAvailable = useStateOrObject(props.update?.available, props.stateOrObjectHandler);
    const updateVersion = useStateOrObject(props.update?.version, props.stateOrObjectHandler);
    const updateNewVersion = useStateOrObject(props.update?.newVersion, props.stateOrObjectHandler);

    // The new value slides in when it changes
    const rssiRef = useValueTick<HTMLSpanElement>(rssi);
    const batteryRef = useValueTick<HTMLSpanElement>(battery);

    const pills: React.JSX.Element[] = [];

    // Connection
    const connectionSymbol = getConnectionSymbol(props.connectionType, connection);
    if (connectionSymbol) {
        const known = connection === 'connected' || connection === 'disconnected';
        const tooltip = known
            ? (connection === 'connected'
                  ? getTranslation('connectedIconTooltip')
                  : getTranslation('disconnectedIconTooltip')) +
              (props.statusAction ? `. ${getTranslation(props.statusAction.description || 'moreInformation')}` : '')
            : undefined;
        pills.push(
            <StatusPill
                key="connection"
                tone={connection === 'disconnected' ? 'err' : undefined}
                tooltip={tooltip}
                onClick={
                    known && props.statusAction
                        ? () => props.deviceHandler(props.deviceId, props.statusAction!)()
                        : undefined
                }
            >
                {known ? connectionSymbol : <span style={{ display: 'flex', opacity: 0.55 }}>{connectionSymbol}</span>}
            </StatusPill>,
        );
    }

    // Signal strength
    const rssiNumber = rssi === undefined || rssi === null || (rssi as unknown) === '' ? NaN : Number(rssi);
    if (!isNaN(rssiNumber) && rssiNumber !== 0) {
        pills.push(
            <StatusPill
                key="rssi"
                tone={rssiNumber < -80 ? 'warn' : undefined}
                tooltip={`RSSI: ${rssiNumber} dBm`}
            >
                <IconSignal rssi={rssiNumber} />
                <span ref={rssiRef}>{rssiNumber}</span>
            </StatusPill>,
        );
    }

    // Battery. A button if the backend offers the reserved "battery" action (e.g. for the battery history)
    if (battery !== undefined && battery !== null && (battery as unknown) !== '') {
        let icon: React.JSX.Element;
        let text: string | null = null;
        let tone: 'warn' | 'err' | undefined;
        if (typeof battery === 'number') {
            icon = <IconBattery level={battery} />;
            text = `${battery}%`;
            tone = battery <= 10 ? 'err' : battery <= 25 ? 'warn' : undefined;
        } else if (typeof battery === 'boolean') {
            icon = <IconBattery level={battery ? 100 : 0} />;
            tone = battery ? undefined : 'err';
        } else if (battery === 'charging') {
            icon = <IconBattery charging />;
        } else {
            icon = <IconBattery />;
            text = battery.includes('V') ? battery : `${battery} mV`;
        }
        pills.push(
            <StatusPill
                key="battery"
                tone={tone}
                tooltip={
                    getTranslation('batteryTooltip') +
                    (props.batteryAction
                        ? `. ${getTranslation(props.batteryAction.description || 'moreInformation')}`
                        : '')
                }
                onClick={
                    props.batteryAction ? () => props.deviceHandler(props.deviceId, props.batteryAction!)() : undefined
                }
            >
                {icon}
                {text ? <span ref={batteryRef}>{text}</span> : null}
            </StatusPill>,
        );
    }

    // Warning: it pulses when it appears or changes
    if (warning) {
        const text = typeof warning === 'string' || typeof warning === 'object' ? getTranslation(warning) : '';
        pills.push(
            <StatusPill
                key="warning"
                tone="warn"
                tooltip={text || undefined}
            >
                <IconStatusLed
                    color="var(--dm-warn)"
                    beat={typeof warning === 'object' ? JSON.stringify(warning) : warning}
                >
                    <WarningIcon fontSize="inherit" />
                </IconStatusLed>
            </StatusPill>,
        );
    }

    // Update
    if (updateAvailable) {
        const versions = updateNewVersion ? `${updateVersion ? `${updateVersion} → ` : ''}${updateNewVersion}` : '';
        pills.push(
            <StatusPill
                key="update"
                tone="info"
                tooltip={getTranslation('updateAvailable') + (versions ? `: ${versions}` : '')}
                onClick={
                    props.updateAction
                        ? () => {
                              // An update is a significant operation, so always ask for confirmation
                              // before triggering it. Reuse the action's own confirmation message if the
                              // backend provided one; otherwise build a default one including the versions.
                              // The confirmation is then handled by the standard device action flow
                              // (deviceHandler -> showConfirmation -> renderConfirmationDialog).
                              let confirmation: boolean | ioBroker.StringOrTranslated | undefined =
                                  props.updateAction!.confirmation;
                              if (!confirmation) {
                                  let message = getTranslation('updateConfirmation');
                                  if (versions) {
                                      message += `: ${versions}`;
                                  }
                                  confirmation = { [I18n.getLanguage()]: message, en: message };
                              }
                              props.deviceHandler(props.deviceId, { ...props.updateAction!, confirmation })();
                          }
                        : undefined
                }
            >
                <IconUpdate />
            </StatusPill>,
        );
    }

    return pills.length ? <>{pills}</> : null;
}

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
export function DeviceLed(props: DeviceLedProps): React.JSX.Element | null {
    const status = normalizeStatus(props.status);
    const connection = useStateOrObject(status.connection, props.stateOrObjectHandler);
    const rssi = useStateOrObject(status.rssi, props.stateOrObjectHandler);

    // Only a change of a known value is a beat, not the first value after the (re)mount of the card
    const [beat, setBeat] = useState<{ rssi: unknown; count: number }>({ rssi: undefined, count: 0 });
    if (rssi !== undefined && rssi !== null && rssi !== beat.rssi) {
        // Adjusting the state while rendering, as React recommends for values derived from a change
        setBeat({ rssi, count: beat.rssi === undefined ? 0 : beat.count + 1 });
    }

    if (connection !== 'connected' && connection !== 'disconnected') {
        return null;
    }

    let color = connection === 'connected' ? 'green' : 'red';
    if (!props.alive || props.enabled === false) {
        color = 'grey';
    }

    return (
        <span className="dm-avatar-led">
            <IconStatusLed
                color={color}
                beat={beat.count}
                ariaLabel={
                    connection === 'connected'
                        ? getTranslation('connectedIconTooltip')
                        : getTranslation('disconnectedIconTooltip')
                }
            />
        </span>
    );
}
