import { Battery20 as Battery20Icon, Battery30 as Battery30Icon, Battery50 as Battery50Icon, Battery60 as Battery60Icon, Battery80 as Battery80Icon, Battery90 as Battery90Icon, BatteryAlert as BatteryAlertIcon, BatteryCharging50 as BatteryCharging50Icon, BatteryFull as BatteryFullIcon, Bluetooth as IconConnectionBluetooth, Cable as IconConnectionLan, BluetoothDisabled as IconConnectionNoBluetooth, WifiOff as IconConnectionNoWifi, Wifi as IconConnectionWifi, Link as LinkIcon, LinkOff as LinkOffIcon, NetworkCheck as NetworkCheckIcon, Warning as WarningIcon, } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import React, { useMemo } from 'react';
import { useStateOrObject } from './hooks';
import Switch from './Switch';
import { getTranslation } from './Utils';
export const ACTIONS = {
    STATUS: 'status',
    DISABLE: 'disable',
    ENABLE: 'enable',
};
const styles = {
    tooltip: {
        pointerEvents: 'none',
    },
};
function ThreadIcon(props) {
    return (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", onClick: e => props.onClick && props.onClick(e), viewBox: "0 0 165 165", width: props.width || (props.fontSize === 'small' ? 16 : 20), height: props.height || props.width || (props.fontSize === 'small' ? 16 : 20), className: props.className, style: props.style },
        React.createElement("path", { fill: "currentColor", d: "M82.498,0C37.008,0,0,37.008,0,82.496c0,45.181,36.51,81.977,81.573,82.476V82.569l-27.002-0.002  c-8.023,0-14.554,6.53-14.554,14.561c0,8.023,6.531,14.551,14.554,14.551v17.98c-17.939,0-32.534-14.595-32.534-32.531  c0-17.944,14.595-32.543,32.534-32.543l27.002,0.004v-9.096c0-14.932,12.146-27.08,27.075-27.08  c14.932,0,27.082,12.148,27.082,27.08c0,14.931-12.15,27.08-27.082,27.08l-9.097-0.001v80.641  C136.889,155.333,165,122.14,165,82.496C165,37.008,127.99,0,82.498,0z" }),
        React.createElement("path", { fill: "currentColor", d: "M117.748,55.493c0-5.016-4.082-9.098-9.1-9.098c-5.015,0-9.097,4.082-9.097,9.098v9.097l9.097,0.001  C113.666,64.591,117.748,60.51,117.748,55.493z" })));
}
function ZWaveIcon(props) {
    return (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", onClick: e => props.onClick && props.onClick(e), viewBox: "0 0 1073 1068", width: props.width || (props.fontSize === 'small' ? 16 : 20), height: props.height || props.width || (props.fontSize === 'small' ? 16 : 20), className: props.className, style: props.style },
        React.createElement("path", { fill: "currentColor", d: "M716 1.1C632.9 5.3 549.8 23.7 472 55c-66.4 26.7-132.6 65.5-188.5 110.4-43.8 35.1-85.2 76.7-120.1 120.6C72.4 400.4 16.7 539.8 3.5 686 1.8 705.1-.1 754.7.7 758c.5 2 1 2 49.7 1.8l49.1-.3.7-20c2.4-64.6 13.4-126 33.2-186 80.8-243.9 297-419.9 552.1-449.4 20.2-2.4 44.2-4.1 56.6-4.1h8.9V50 0l-9.7.1c-5.4.1-16.8.6-25.3 1zm-.8 208c-78.5 4.7-158 27.4-226.5 64.5-68.7 37.3-126.4 86.3-175.2 148.9-11 14-33.2 47.3-42.3 63.5-44 77.8-68.6 164.9-70.9 251.2l-.6 22.8h49.5 49.4l1.2-19c6.3-98.7 40-185.8 102.2-263.3 12.7-15.9 41.2-45.2 57-58.7 66.1-56.3 142.1-91.8 226-105.5 18.9-3 44.1-5.5 56.7-5.5h9.3v-50-50l-11.2.1c-6.2.1-17.3.6-24.6 1zm17.8 251c-104.5 9.2-195.2 69.7-243.6 162.4-43.9 84-45.5 184.2-4.5 270 60.3 125.9 198.1 194.2 334.9 166 46.6-9.7 89.5-29.7 127.2-59.6 13.5-10.7 37.3-34.5 48-47.9 34.2-43.1 55.2-92 63.7-148.6 2.2-15.1 2.5-62.7.5-77.4-3.6-25.2-10.1-51.4-17.8-71.2-10.1-26.2-29.4-59.7-47-81.8-9.7-12.1-35-37.2-47.4-47-47.8-37.9-104.5-60.1-165.4-65-14.7-1.1-34.7-1.1-48.6.1zm174.7 138.6c-.3.5-30.9 49.2-68.1 108.3L772 814.5l67.9.5 68 .5-30.1 48.8-30 48.7h-131c-104.4 0-130.9-.3-130.5-1.3.2-.6 32.7-51.1 72.1-112.1L730 687.9c0-.5-29.5-1-66.5-1.1l-66.6-.3 27.7-44.3 27.6-44.2h128l127.5.7z" })));
}
function ZigBeeIcon(props) {
    return (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", onClick: e => props.onClick && props.onClick(e), viewBox: "0 0 48 48", width: props.width || (props.fontSize === 'small' ? 16 : 20), height: props.height || props.width || (props.fontSize === 'small' ? 16 : 20), className: props.className, style: props.style },
        React.createElement("path", { fill: "currentColor", d: "M32.042,9.792c4.595,1.238,4.88,3.165,5.524,5.048C34.841,17.664,17.35,35.7,17.35,35.7 s10.901,1.177,23.487-1.003c-0.001,0.029-0.002,0.048-0.003,0.076C42.829,31.661,44,27.97,44,24c0-11.046-8.954-20-20-20 c-5.634,0-10.715,2.338-14.35,6.087C15.489,9.124,26.89,8.403,32.042,9.792z" }),
        React.createElement("path", { fill: "currentColor", d: "M14.724,37.285c-1.982-0.347-4.212-2.131-4.707-5.302c1.437-1.239,19.994-20.507,19.994-20.507 c-7.008-0.424-14.569-0.465-22.237,0.864C5.408,15.625,4,19.644,4,24c0,11.046,8.954,20,20,20c6.173,0,11.689-2.8,15.358-7.195 C35.486,37.33,23.257,38.769,14.724,37.285z" })));
}
function rssiColor(signal, themeType) {
    if (signal < -80) {
        return themeType === 'dark' ? '#ff5c5c' : '#aa0000';
    }
    if (signal < -60) {
        return themeType === 'dark' ? '#fa8547' : '#ae5c00';
    }
    if (signal < -50) {
        return themeType === 'dark' ? '#cdff4f' : '#7b9500';
    }
    return themeType === 'dark' ? '#5cff5c' : '#008500';
}
const iconStyleOK = {
    fill: '#00ac00',
    color: '#00ac00',
};
const iconStyleNotOK = {
    fill: '#ff0000',
    color: '#ff0000',
};
const iconStyleWarning = {
    fill: '#da8200',
    color: '#da8200',
};
const iconStyleUnknown = {
    fill: '#8a8a8a',
    color: '#8a8a8a',
};
const iconStylePreWarning = {
    fill: '#ffcc00',
    color: '#ffcc00',
};
function getBatteryIcon(battery) {
    if (battery > 95) {
        return React.createElement(BatteryFullIcon, { style: iconStyleOK });
    }
    if (battery > 85 && battery <= 95) {
        return React.createElement(Battery90Icon, { style: iconStyleOK });
    }
    if (battery > 70 && battery <= 85) {
        return React.createElement(Battery80Icon, { style: iconStyleOK });
    }
    if (battery > 55 && battery <= 70) {
        return React.createElement(Battery60Icon, { style: iconStyleOK });
    }
    if (battery > 40 && battery <= 55) {
        return React.createElement(Battery50Icon, { style: iconStylePreWarning });
    }
    if (battery > 25 && battery <= 40) {
        return React.createElement(Battery30Icon, { style: iconStylePreWarning });
    }
    if (battery > 10 && battery <= 25) {
        return React.createElement(Battery20Icon, { style: iconStyleWarning });
    }
    return React.createElement(BatteryAlertIcon, { style: iconStyleNotOK });
}
/**
 * Device Status component
 *
 * @param props - Parameters
 * @param props.status - Status object, e.g. { connection: 'connected', battery: 100, rssi: -50 }
 */
export default function DeviceStatus(props) {
    let status;
    if (!props.status) {
        status = {};
    }
    else if (typeof props.status === 'string') {
        status = {
            connection: props.status,
        };
    }
    else {
        status = props.status;
    }
    const connection = useStateOrObject(status.connection, props.socket);
    const rssi = useStateOrObject(status.rssi, props.socket);
    const battery = useStateOrObject(status.battery, props.socket);
    const warning = useStateOrObject(status.warning, props.socket);
    const batteryIconTooltip = useMemo(() => {
        if (typeof battery === 'number') {
            return getBatteryIcon(battery);
        }
        return null;
    }, [battery]);
    const disability = typeof props.enabled === 'boolean' ? (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { flexGrow: 1 } }),
        React.createElement(Tooltip, { title: props.enabled ? getTranslation('disableIconTooltip') : getTranslation('enableIconTooltip'), slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                React.createElement(Switch, { size: "small", checked: props.enabled, disabled: !props.disableEnableAction, onChange: () => props.disableEnableAction &&
                        props.deviceHandler(props.deviceId, props.disableEnableAction, props.refresh)(), theme: props.theme }))))) : null;
    let connectionSymbol;
    if (props.connectionType === 'wifi') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(IconConnectionWifi, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(IconConnectionNoWifi, { style: iconStyleNotOK })) : (React.createElement(IconConnectionWifi, { style: iconStyleUnknown }));
    }
    else if (props.connectionType === 'bluetooth') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(IconConnectionBluetooth, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(IconConnectionNoBluetooth, { style: iconStyleNotOK })) : (React.createElement(IconConnectionBluetooth, { style: iconStyleUnknown }));
    }
    else if (props.connectionType === 'lan') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(IconConnectionLan, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(IconConnectionLan, { style: iconStyleNotOK })) : (React.createElement(IconConnectionLan, { style: iconStyleUnknown }));
    }
    else if (props.connectionType === 'thread') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(ThreadIcon, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(ThreadIcon, { style: iconStyleNotOK })) : (React.createElement(ThreadIcon, { style: iconStyleUnknown }));
    }
    else if (props.connectionType === 'z-wave') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(ZWaveIcon, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(ZWaveIcon, { style: iconStyleNotOK })) : (React.createElement(ZWaveIcon, { style: iconStyleUnknown }));
    }
    else if (props.connectionType === 'zigbee') {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(ZigBeeIcon, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(ZigBeeIcon, { style: iconStyleNotOK })) : (React.createElement(ZigBeeIcon, { style: iconStyleUnknown }));
    }
    else {
        connectionSymbol =
            connection === 'connected' ? (React.createElement(LinkIcon, { style: iconStyleOK })) : connection === 'disconnected' ? (React.createElement(LinkOffIcon, { style: iconStyleNotOK })) : null;
    }
    const connectionIcon = connection === 'connected' || connection === 'disconnected' ? (React.createElement(Tooltip, { title: (connection === 'connected'
            ? getTranslation('connectedIconTooltip')
            : getTranslation('disconnectedIconTooltip')) +
            (props.statusAction
                ? `. ${getTranslation(props.statusAction.description || 'moreInformation')}`
                : ''), slotProps: { popper: { sx: styles.tooltip } } }, props.statusAction ? (React.createElement(IconButton, { onClick: e => {
            if (props.statusAction) {
                e.stopPropagation();
                props.deviceHandler(props.deviceId, props.statusAction, props.refresh)();
            }
        } },
        connectionSymbol,
        React.createElement("div", { style: { position: 'absolute', top: 0, left: 0, color: 'grey' } }, "*"))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }, connectionSymbol)))) : (connectionSymbol);
    return (React.createElement("div", { style: {
            display: 'flex',
            alignItems: 'baseline',
            cursor: props.statusAction ? 'pointer' : undefined,
            width: props.disableEnableAction ? '100%' : undefined,
            gap: 8,
        } },
        connectionIcon,
        rssi && (React.createElement(Tooltip, { title: "RSSI", slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                React.createElement(NetworkCheckIcon, { style: { color: rssiColor(rssi, props.theme.palette.mode) } }),
                React.createElement("p", { style: { fontSize: 'small', margin: 0 } }, rssi)))),
        typeof battery === 'number' && (React.createElement(Tooltip, { title: getTranslation('batteryTooltip'), slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                batteryIconTooltip,
                React.createElement("p", { style: { fontSize: 'small', margin: 0 } },
                    battery,
                    "%")))),
        typeof battery === 'string' && (React.createElement(Tooltip, { title: getTranslation('batteryTooltip'), slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                battery === 'charging' ? React.createElement(BatteryCharging50Icon, null) : React.createElement(BatteryFullIcon, null),
                battery !== 'charging' ? (battery.includes('V') || battery.includes('mV') ? (React.createElement("p", { style: { fontSize: 'small', margin: 0 } }, battery)) : (React.createElement("p", { style: { fontSize: 'small', margin: 0 } },
                    React.createElement("span", { style: { marginRight: 4 } }, battery),
                    "mV"))) : null))),
        typeof battery === 'boolean' && (React.createElement(Tooltip, { title: getTranslation('batteryTooltip'), slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }, battery ? (React.createElement(BatteryFullIcon, { style: iconStyleOK })) : (React.createElement(BatteryAlertIcon, { style: iconStyleNotOK }))))),
        warning ? (typeof warning === 'string' || typeof warning === 'object' ? (React.createElement(Tooltip, { title: getTranslation(warning), slotProps: { popper: { sx: styles.tooltip } } },
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                React.createElement(WarningIcon, { style: iconStyleWarning })))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
            React.createElement(WarningIcon, { style: iconStyleWarning })))) : null,
        disability));
}
//# sourceMappingURL=DeviceStatus.js.map