import React from 'react';
import { Add, Article, Bluetooth, BluetoothDisabled, Delete, Edit, FastForward, FastRewind, Fluorescent, Group, Info, Lightbulb, Link as LinkIcon, LinkOff, NotListedLocation, Pause, Person, PlayArrow, Power, QrCode, QuestionMark, Refresh, Search, Settings, Stop, Visibility, Upgrade, WbIncandescent, Wifi, WifiOff, Launch, } from '@mui/icons-material';
import { I18n, Icon } from '@iobroker/adapter-react-v5';
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
        return React.createElement(Delete, { style: { color } });
    }
    if (iconStyle.includes('fa-pen')) {
        return React.createElement(Edit, { style: { color } });
    }
    if (iconStyle.includes('fa-redo-alt')) {
        return React.createElement(Refresh, { style: { color } });
    }
    if (iconStyle.includes('fa-plus')) {
        return React.createElement(Add, { style: { color } });
    }
    if (iconStyle.includes('fa-qrcode') || iconStyle.includes('qrcode')) {
        return React.createElement(QrCode, { style: { color } });
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
        return React.createElement(Visibility, { style: { color } });
    }
    if (iconStyle.includes('fa-search')) {
        return React.createElement(Search, { style: { color } });
    }
    if (iconStyle.includes('fa-unlink')) {
        return React.createElement(LinkOff, { style: { color } });
    }
    if (iconStyle.includes('fa-link')) {
        return React.createElement(LinkIcon, { style: { color } });
    }
    if (iconStyle.includes('fa-search-location')) {
        return React.createElement(NotListedLocation, { style: { color } });
    }
    if (iconStyle.includes('fa-play')) {
        return React.createElement(PlayArrow, { style: { color } });
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
 * @param altName icon name
 * @param color color of the icon
 */
function getIconByName(name, altName, color) {
    if (name === 'edit' || name === 'rename' || altName === 'edit' || altName === 'rename') {
        return React.createElement(Edit, { style: { color } });
    }
    if (name === 'delete' || altName === 'delete') {
        return React.createElement(Delete, { style: { color } });
    }
    if (name === 'refresh' || altName === 'refresh') {
        return React.createElement(Refresh, { style: { color } });
    }
    if (name === 'newDevice' ||
        name === 'new' ||
        name === 'add' ||
        altName === 'newDevice' ||
        altName === 'new' ||
        altName === 'add') {
        return React.createElement(Add, { style: { color } });
    }
    if (name === 'discover' || name === 'search' || altName === 'discover' || altName === 'search') {
        return React.createElement(Search, { style: { color } });
    }
    if (name === 'unpairDevice' || name === 'unpair' || altName === 'unpairDevice' || altName === 'unpair') {
        return React.createElement(LinkOff, { style: { color } });
    }
    if (name === 'pairDevice' || name === 'pair' || altName === 'pairDevice' || altName === 'pair') {
        return React.createElement(LinkIcon, { style: { color } });
    }
    if (name === 'identify' || altName === 'identify') {
        return React.createElement(NotListedLocation, { style: { color } });
    }
    if (name === 'play' || altName === 'play') {
        return React.createElement(PlayArrow, { style: { color } });
    }
    if (name === 'stop' || altName === 'stop') {
        return React.createElement(Stop, { style: { color } });
    }
    if (name === 'pause' || altName === 'pause') {
        return React.createElement(Pause, { style: { color } });
    }
    if (name === 'forward' || name === 'next' || altName === 'forward' || altName === 'next') {
        return React.createElement(FastForward, { style: { color } });
    }
    if (name === 'rewind' || name === 'previous' || altName === 'rewind' || altName === 'previous') {
        return React.createElement(FastRewind, { style: { color } });
    }
    if (name === 'lamp' || name === 'light' || altName === 'lamp' || altName === 'light') {
        return React.createElement(Lightbulb, { style: { color } });
    }
    if (name === 'backlight' || altName === 'backlight') {
        return React.createElement(Fluorescent, { style: { color } });
    }
    if (name === 'dimmer' || altName === 'dimmer') {
        return React.createElement(WbIncandescent, { style: { color } });
    }
    if (name === 'socket' || altName === 'socket') {
        return React.createElement(Power, { style: { color } });
    }
    if (name === 'settings' || altName === 'settings') {
        return React.createElement(Settings, { style: { color } });
    }
    if (name === 'users' || name === 'group' || altName === 'users' || altName === 'group') {
        return React.createElement(Group, { style: { color } });
    }
    if (name === 'user' || altName === 'user') {
        return React.createElement(Person, { style: { color } });
    }
    if (name === 'update' || altName === 'update') {
        return React.createElement(Upgrade, { style: { color } });
    }
    if (name === 'qrcode' || altName === 'qrcode') {
        return React.createElement(QrCode, { style: { color } });
    }
    if (name === 'info' || altName === 'info') {
        return React.createElement(Info, { style: { color } });
    }
    if (name === 'lines' || altName === 'lines') {
        return React.createElement(Article, { style: { color } });
    }
    if (name === 'web' || altName === 'web') {
        return React.createElement(Launch, { style: { color } });
    }
    return React.createElement(QuestionMark, { style: { color } });
}
export function renderControlIcon(action, colors, value) {
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
    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        return getFaIcon(action.icon, color);
    }
    if (value && action.iconOn?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.iconOn, style: { color } }));
    }
    if (action.icon?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.icon, style: { color } }));
    }
    return getIconByName(action.id, action.icon, color);
}
export function renderActionIcon(action) {
    if (!action) {
        return null;
    }
    if (action.icon?.startsWith('fa-') || action.icon?.startsWith('fas')) {
        return getFaIcon(action.icon, action.color);
    }
    if (action.icon?.startsWith('data:image')) {
        return (React.createElement(Icon, { src: action.icon, style: { color: action.color } }));
    }
    return getIconByName(action.id, action.icon, action.color);
}
let language;
/**
 * Get Translation
 */
export function getTranslation(
/** Text to translate */
text, noTranslation) {
    language = language || I18n.getLanguage();
    if (typeof text === 'object') {
        return text[language] || text.en;
    }
    return noTranslation ? text : I18n.t(text);
}
//# sourceMappingURL=Utils.js.map