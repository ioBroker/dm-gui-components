import React from 'react';
import { Add, Article, BatteryAlert, BatteryChargingFull, BatteryFull, Bluetooth, BluetoothDisabled, Edit, FastForward, FastRewind, Fluorescent, Group, Info, Lightbulb, Link as LinkIcon, LinkOff, NotListedLocation, Pause, Person, PlayArrow, Power, QrCode, QuestionMark, Refresh, Search, Settings, Stop, Visibility, Upgrade, WbIncandescent, Wifi, WifiOff, Launch, } from '@mui/icons-material';
import { I18n, Icon, IconPlayPause, IconTrash } from '@iobroker/gui-components';
/**
 * Class of an action symbol that shows what its button does while the mouse is over the button
 * (see `styles.ts`): the gear turns, the pen writes, the lamp glows...
 */
const HOVER = {
    spin: 'dm-ani dm-ani-spin',
    gear: 'dm-ani dm-ani-gear',
    turn: 'dm-ani dm-ani-turn',
    pen: 'dm-ani dm-ani-pen',
    hop: 'dm-ani dm-ani-hop',
    search: 'dm-ani dm-ani-search',
    nudge: 'dm-ani dm-ani-nudge',
    launch: 'dm-ani dm-ani-launch',
    glow: 'dm-ani dm-ani-glow',
    tick: 'dm-ani dm-ani-tick',
};
/** An MUI icon with the given hover animation */
function animated(IconComponent, hover, color) {
    return (React.createElement(IconComponent, { className: hover, style: { color } }));
}
/**
 * Get Icon by font-awesome name. Do not use these names, use names from getIconByName
 *
 * @param icon font-awesome icon name
 * Only following font-awesome icons are supported:
 * - fa-trash-can, fa-trash
 * - fa-pen
 * - fa-redo-alt
 * - fa-plus
 * - fa-qrcode, qrcode
 * - fa-wifi
 * - fa-wifi-slash
 * - fa-bluetooth
 * - fa-bluetooth-slash
 * - fa-eye
 * - fa-search
 * - fa-unlink
 * - fa-link
 * - fa-search-location
 * - fa-play
 * - fa-stop
 * - fa-pause
 * @param color color of the icon
 */
function getFaIcon(icon, color) {
    const iconStyle = icon
        .split(' ')
        .map(s => s.trim())
        .filter(s => s !== 'fa-solid');
    if (iconStyle.includes('fa-trash-can') || iconStyle.includes('fa-trash')) {
        // The lid opens while the mouse is over the button
        return React.createElement(IconTrash, { style: { color } });
    }
    if (iconStyle.includes('fa-pen')) {
        return animated(Edit, HOVER.pen, color);
    }
    if (iconStyle.includes('fa-redo-alt')) {
        return animated(Refresh, HOVER.spin, color);
    }
    if (iconStyle.includes('fa-plus')) {
        return animated(Add, HOVER.turn, color);
    }
    if (iconStyle.includes('fa-qrcode') || iconStyle.includes('qrcode')) {
        return animated(QrCode, HOVER.tick, color);
    }
    if (iconStyle.includes('fa-wifi')) {
        return React.createElement(Wifi, { style: { color } });
    }
    if (iconStyle.includes('fa-wifi-slash')) {
        return React.createElement(WifiOff, { style: { color } });
    }
    if (iconStyle.includes('fa-bluetooth')) {
        return React.createElement(Bluetooth, { style: { color } });
    }
    if (iconStyle.includes('fa-bluetooth-slash')) {
        return React.createElement(BluetoothDisabled, { style: { color } });
    }
    if (iconStyle.includes('fa-eye')) {
        return animated(Visibility, HOVER.tick, color);
    }
    if (iconStyle.includes('fa-search')) {
        return animated(Search, HOVER.search, color);
    }
    if (iconStyle.includes('fa-unlink')) {
        return React.createElement(LinkOff, { style: { color } });
    }
    if (iconStyle.includes('fa-link')) {
        return React.createElement(LinkIcon, { style: { color } });
    }
    if (iconStyle.includes('fa-search-location')) {
        return animated(NotListedLocation, HOVER.hop, color);
    }
    if (iconStyle.includes('fa-play')) {
        return animated(PlayArrow, HOVER.nudge, color);
    }
    if (iconStyle.includes('fa-stop')) {
        return React.createElement(Stop, { style: { color } });
    }
    if (iconStyle.includes('fa-pause')) {
        return React.createElement(Pause, { style: { color } });
    }
    return React.createElement(QuestionMark, { style: { color } });
}
/**
 * Get Icon by name or by action
 *
 * @param name action name
 * possible action or icon names are
 * - edit, rename
 * - delete
 * - refresh
 * - newDevice, new, add
 * - discover, search
 * - unpairDevice, unpair
 * - pairDevice, pair
 * - identify
 * - play
 * - stop
 * - pause
 * - forward, next
 * - rewind, previous
 * - lamp, light
 * - backlight
 * - dimmer
 * - socket
 * - settings
 * - users, group
 * - user
 * - qrcode
 * - identify
 * - info
 * - lines
 * - battery
 * - batteryLow, batteryAlert
 * - batteryCharging
 * @param altName icon name
 * @param color color of the icon
 * @param noDefaultIcon if true, no "question mark" icon will be returned for unknown names
 */
function getIconByName(name, altName, color, noDefaultIcon) {
    const is = (...names) => names.includes(name) || (!!altName && names.includes(altName));
    if (is('edit', 'rename')) {
        return animated(Edit, HOVER.pen, color);
    }
    if (is('delete')) {
        // The lid opens while the mouse is over the button
        return React.createElement(IconTrash, { style: { color } });
    }
    if (is('refresh')) {
        return animated(Refresh, HOVER.spin, color);
    }
    if (is('newDevice', 'new', 'add')) {
        return animated(Add, HOVER.turn, color);
    }
    if (is('discover', 'search')) {
        return animated(Search, HOVER.search, color);
    }
    if (is('unpairDevice', 'unpair')) {
        return React.createElement(LinkOff, { style: { color } });
    }
    if (is('pairDevice', 'pair')) {
        return React.createElement(LinkIcon, { style: { color } });
    }
    if (is('identify')) {
        return animated(NotListedLocation, HOVER.hop, color);
    }
    if (is('play')) {
        return animated(PlayArrow, HOVER.nudge, color);
    }
    if (is('stop')) {
        return React.createElement(Stop, { style: { color } });
    }
    if (is('pause')) {
        return React.createElement(Pause, { style: { color } });
    }
    if (is('forward', 'next')) {
        return animated(FastForward, HOVER.nudge, color);
    }
    if (is('rewind', 'previous')) {
        return React.createElement(FastRewind, { style: { color } });
    }
    if (is('lamp', 'light')) {
        return animated(Lightbulb, HOVER.glow, color);
    }
    if (is('backlight')) {
        return animated(Fluorescent, HOVER.glow, color);
    }
    if (is('dimmer')) {
        return animated(WbIncandescent, HOVER.glow, color);
    }
    if (is('socket')) {
        return React.createElement(Power, { style: { color } });
    }
    if (is('settings')) {
        return animated(Settings, HOVER.gear, color);
    }
    if (is('users', 'group')) {
        return React.createElement(Group, { style: { color } });
    }
    if (is('user')) {
        return React.createElement(Person, { style: { color } });
    }
    if (is('update')) {
        return animated(Upgrade, HOVER.hop, color);
    }
    if (is('qrcode')) {
        return animated(QrCode, HOVER.tick, color);
    }
    if (is('info')) {
        return animated(Info, HOVER.tick, color);
    }
    if (is('lines')) {
        return React.createElement(Article, { style: { color } });
    }
    if (is('web')) {
        return animated(Launch, HOVER.launch, color);
    }
    if (is('battery')) {
        return React.createElement(BatteryFull, { style: { color } });
    }
    if (is('batteryLow', 'batteryAlert')) {
        return React.createElement(BatteryAlert, { style: { color } });
    }
    if (is('batteryCharging')) {
        return React.createElement(BatteryChargingFull, { style: { color } });
    }
    if (noDefaultIcon) {
        return null;
    }
    return React.createElement(QuestionMark, { style: { color } });
}
export function renderControlIcon(action, colors, value, noDefaultIcon) {
    if (!action) {
        return null;
    }
    let color = (value && action.colorOn) || action.color || (action.state ? 'primary' : 'inherit');
    if (colors) {
        if (color === 'primary') {
            color = colors.primary;
        }
        else if (color === 'secondary') {
            color = colors.secondary;
        }
    }
    // A play or pause toggle shows what a click does: play while it is stopped, pause while it runs.
    // The symbol morphs from one into the other.
    const isPlayPause = 'type' in action &&
        action.type === 'icon' &&
        !action.iconOn &&
        (action.id === 'play' ||
            action.id === 'pause' ||
            action.icon === 'play' ||
            action.icon === 'pause' ||
            action.icon === 'fa-play' ||
            action.icon === 'fa-pause');
    if (isPlayPause) {
        return (React.createElement(IconPlayPause, { running: !!value, style: { color } }));
    }
    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        return getFaIcon(action.icon, color);
    }
    if (value && action.iconOn?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.iconOn, style: { color } }));
    }
    if (action.icon?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.icon, style: { color } }));
    }
    if (!noDefaultIcon) {
        return getIconByName(action.id, action.icon, color);
    }
    return null;
}
/**
 * Render an icon that is given as a plain name (and not as a part of an action or control)
 *
 * @param icon `fa-*` name, `data:image/...` string, URL or one of the names supported by `getIconByName`
 * @param color color of the icon
 * @param noDefaultIcon if true, no "question mark" icon will be returned for unknown or missing names
 */
export function renderIcon(icon, color, noDefaultIcon) {
    if (!icon) {
        return noDefaultIcon ? null : React.createElement(QuestionMark, { style: { color } });
    }
    if (icon.startsWith('fa-') || icon.startsWith('fas')) {
        return getFaIcon(icon, color);
    }
    if (icon.startsWith('data:image') ||
        icon.startsWith('http://') ||
        icon.startsWith('https://') ||
        icon.includes('/') ||
        /\.(png|jpe?g|svg|gif|webp|ico)$/i.test(icon)) {
        return (React.createElement(Icon, { src: icon, style: { color } }));
    }
    return getIconByName(icon, undefined, color, noDefaultIcon);
}
/**
 * Resolve the color of a status indicator.
 *
 * The semantic tokens use the same colors as the built-in status icons, but adapted to the theme,
 * so custom indicators do not look foreign next to connection, battery, warning and update.
 *
 * @param color semantic token, `primary`, `secondary` or an explicit CSS color
 * @param theme current theme
 */
export function getIndicatorColor(color, theme) {
    if (!color) {
        return undefined;
    }
    const dark = theme.palette.mode === 'dark';
    switch (color) {
        case 'ok':
            return dark ? '#5cff5c' : '#00ac00';
        case 'warning':
            return dark ? '#ffa733' : '#da8200';
        case 'error':
            return dark ? '#ff5c5c' : '#ff0000';
        case 'info':
            return dark ? '#64b5f6' : '#2196f3';
        case 'inactive':
            return '#8a8a8a';
        case 'primary':
            return theme.palette.primary.main;
        case 'secondary':
            return theme.palette.secondary.main;
        default:
            return color;
    }
}
export function renderActionIcon(action, noDefaultIcon) {
    if (!action) {
        return null;
    }
    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        return getFaIcon(action.icon, action.color);
    }
    if (action.icon?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.icon, style: { color: action.color } }));
    }
    return getIconByName(action.id, action.icon, action.color, noDefaultIcon);
}
let language;
/**
 * Get Translation
 */
export function getTranslation(
/** Text to translate */
text, noTranslation) {
    language ||= I18n.getLanguage();
    if (typeof text === 'object') {
        return text[language] || text.en;
    }
    return noTranslation ? text : I18n.t(text);
}
/**
 * Resolve a possibly translated text into the current language.
 *
 * Unlike `getTranslation`, a plain string is returned untouched: device names, models and
 * manufacturers are data, not keys of the i18n dictionary.
 */
export function getText(text) {
    if (typeof text === 'object') {
        language ||= I18n.getLanguage();
        return text[language] || text.en;
    }
    return text;
}
//# sourceMappingURL=Utils.js.map