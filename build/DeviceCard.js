import React, { PureComponent } from 'react';
import { Close as CloseIcon, VideogameAsset as ControlIcon, MoreVert as MoreVertIcon, ExpandMore, } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, Paper, Skeleton, Tooltip, Typography, Accordion, AccordionSummary, AccordionDetails, } from '@mui/material';
import { DeviceTypeIcon, Utils, Icon, } from '@iobroker/gui-components';
import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceImageUpload from './DeviceImageUpload';
import DeviceStatusComponent from './DeviceStatus';
import JsonConfig from './JsonConfig';
import { StatusIndicators } from './StatusIndicator';
import { getText, getTranslation } from './Utils';
/** Reserved action names (this is copied from https://github.com/ioBroker/dm-utils/blob/main/src/types/base.ts as we can only have type references to dm-utils) */
const ACTIONS = {
    /** This action will be called when the user clicks on the connection icon */
    STATUS: 'status',
    /** This action will be called when the user clicks on the enabled / disabled icon. The enabled/disabled icon will be shown only if the node status has the "enabled" flag set to false or true */
    ENABLE_DISABLE: 'enable/disable',
    /** This action will be called when the user clicks on the update indicator. The update indicator is shown only if `DeviceInfo.update.available` is true */
    UPDATE: 'update',
    /** This action will be called when the user clicks on the battery indicator. The battery indicator is shown only if the node status has the "battery" property */
    BATTERY: 'battery',
};
/**
 * Footprint of a card. The list needs it to give a not yet rendered card a placeholder of exactly
 * the same size, so that neither the layout nor the length of the scrollbar changes.
 */
export const CARD_WIDTH = 300;
export const CARD_MIN_HEIGHT = 280;
export const CARD_MARGIN = 10;
export const SMALL_CARD_WIDTH = 200;
export const SMALL_CARD_MIN_HEIGHT = 200;
export const SMALL_CARD_MARGIN = 5;
const cardSize = { width: CARD_WIDTH, minHeight: CARD_MIN_HEIGHT, margin: CARD_MARGIN };
const smallCardSize = {
    width: SMALL_CARD_WIDTH,
    minHeight: SMALL_CARD_MIN_HEIGHT,
    margin: SMALL_CARD_MARGIN,
};
/** A card that sits in a container which already has the footprint of a card */
const filledCardSize = { width: '100%', margin: 0 };
/**
 * Icons read from the file storage of the adapter, keyed by `<instance>/<file>`.
 *
 * A card is unmounted and mounted again while scrolling, and without this cache every one of those
 * would repeat the `readFile` round trip for an icon that is very often not there at all.
 */
const fileIconCache = new Map();
const styles = {
    cardStyle: (theme) => ({
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? '#0b0b0b' : '#d5d5d5',
    }),
    headerStyle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
        paddingRight: 8,
        position: 'relative',
        minHeight: 60,
        color: '#000',
    },
    imgAreaStyle: {
        height: 45,
        width: 45,
        justifyContent: 'center',
        display: 'flex',
        alignItems: 'center',
    },
    imgStyle: {
        zIndex: 2,
        maxWidth: '100%',
        maxHeight: '100%',
        color: '#FFF',
    },
    titleStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        // whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    detailsButtonStyle: {
        right: 20,
        bottom: -20,
        position: 'absolute',
    },
    bodyStyle: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    deviceInfoStyle: {
        padding: '20px 16px 0 16px',
    },
    statusStyle: {
        padding: '15px 25px 0 15px',
        // The line may grow if the device provides custom indicators, so only the minimum is fixed
        minHeight: 41,
    },
};
function NoImageIcon(props) {
    return (React.createElement("svg", { viewBox: "0 0 24 24", width: "24", height: "24", style: props.style, className: props.className },
        React.createElement("path", { fill: "currentColor", d: "M21.9,21.9l-8.49-8.49l0,0L3.59,3.59l0,0L2.1,2.1L0.69,3.51L3,5.83V19c0,1.1,0.9,2,2,2h13.17l2.31,2.31L21.9,21.9z M5,18 l3.5-4.5l2.5,3.01L12.17,15l3,3H5z M21,18.17L5.83,3H19c1.1,0,2,0.9,2,2V18.17z" })));
}
/**
 * Device Card Component.
 *
 * A `PureComponent`: the list re-renders on every loading step, on every filter change and on every
 * resolved device value. Without the shallow property comparison all cards would be re-rendered
 * every time, so all properties the list passes down are kept stable there.
 */
export default class DeviceCard extends PureComponent {
    /** True as long as the component is mounted; guards the asynchronous icon loading */
    mounted = false;
    constructor(props) {
        super(props);
        const cacheKey = DeviceCard.iconCacheKey(props);
        this.state = {
            open: false,
            details: null,
            data: {},
            showControlDialog: false,
            // Take a known icon over directly, so a card that is scrolled back into view does not flicker
            localIcon: cacheKey ? fileIconCache.get(cacheKey) : undefined,
        };
    }
    /**
     * Key of the icon in the file storage, or `null` if the device brings its own icon.
     *
     * The file is named after manufacturer and model, both of which may be bound to a state or an
     * object and therefore arrive only after the first render.
     */
    static iconCacheKey(props) {
        if (props.device.icon) {
            return null;
        }
        const manufacturer = props.fields.manufacturer;
        const model = props.fields.model;
        const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || JSON.stringify(props.device.id)}`;
        return `${props.instanceId.replace('system.adapter.', '')}/${fileName}.webp`;
    }
    async fetchIcon() {
        const cacheKey = DeviceCard.iconCacheKey(this.props);
        if (cacheKey) {
            const cached = fileIconCache.get(cacheKey);
            if (cached !== undefined) {
                if (this.state.localIcon !== cached) {
                    this.setState({ localIcon: cached });
                }
                return;
            }
            const [adapter, ...rest] = cacheKey.split('/');
            try {
                const file = await this.props.socket.readFile(adapter, rest.join('/'), true);
                const localIcon = file ? `data:${file.mimeType};base64,${file.file}` : '';
                fileIconCache.set(cacheKey, localIcon);
                if (!this.mounted) {
                    return;
                }
                this.setState({ localIcon });
                // const response = await fetch(url);
                // if (response.ok) {
                //     const blob = await response.blob();
                //     const reader = new FileReader();
                //     reader.onloadend = () => {
                //         setIcon(reader.result);
                //     };
                //     reader.readAsDataURL(blob);
                // } else {
                //     throw new Error('Response not ok');
                // }
            }
            catch {
                fileIconCache.set(cacheKey, '');
                if (this.mounted && this.state.localIcon) {
                    this.setState({ localIcon: '' });
                }
            }
        }
    }
    componentDidMount() {
        this.mounted = true;
        void this.fetchIcon().catch(e => console.error(e));
    }
    componentDidUpdate(prevProps) {
        // The icon is looked up in the file storage under `<manufacturer>_<model>`. Both may be bound
        // to a state or an object and therefore arrive only after the first render.
        if (prevProps.fields.manufacturer !== this.props.fields.manufacturer ||
            prevProps.fields.model !== this.props.fields.model ||
            prevProps.device.icon !== this.props.device.icon) {
            void this.fetchIcon().catch(e => console.error(e));
        }
    }
    componentWillUnmount() {
        this.mounted = false;
    }
    /**
     * Load the device details
     */
    async loadDetails() {
        console.log(`Loading device details for`, this.props.device.id, `... from ${this.props.instanceId}`);
        const details = await this.props.socket.sendTo(this.props.instanceId, 'dm:deviceDetails', this.props.device.id);
        console.log(`Got device details for`, this.props.device.id, details);
        this.setState({ details, data: details?.data || {} });
    }
    /**
     * Copy the device ID to the clipboard
     */
    copyToClipboard = () => {
        const textToCopy = this.props.fields.identifier;
        if (!textToCopy) {
            return;
        }
        Utils.copyToClipboard(textToCopy);
        alert(`${getTranslation('copied')} ${textToCopy} ${getTranslation('toClipboard')}!`);
    };
    renderDialog() {
        if (!this.state.open || !this.state.details) {
            return null;
        }
        return (React.createElement(Dialog, { open: !0, maxWidth: "md", onClose: () => this.setState({ open: false }) },
            React.createElement(DialogContent, null,
                React.createElement(JsonConfig, { instanceId: this.props.instanceId, socket: this.props.socket, schema: this.state.details.schema, data: this.state.data, onChange: (data) => data && this.setState({ data }), themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat })),
            React.createElement(DialogActions, null,
                React.createElement(Button, { disabled: !this.props.alive, variant: "contained", color: "primary", onClick: () => this.setState({ open: false }), autoFocus: true }, getTranslation('closeButtonText')))));
    }
    renderControlItems(controls, allControls, colors, parentGroupId) {
        return controls
            .filter(control => (parentGroupId ? control.group === parentGroupId : !control.group))
            .map(control => {
            if (control.type === 'group') {
                const children = allControls.filter(ctrl => ctrl.group === control.id);
                return (React.createElement(Accordion, { key: control.id },
                    React.createElement(AccordionSummary, { expandIcon: React.createElement(ExpandMore, null) },
                        React.createElement(Typography, { component: "span", style: { display: 'flex', gap: 8, color: control.color } },
                            control.icon ? React.createElement(Icon, { src: control.icon }) : null,
                            getTranslation(control.label))),
                    React.createElement(AccordionDetails, { style: { display: 'flex', flexDirection: 'column' } }, this.renderControlItems(children, allControls, colors, control.id))));
            }
            return (React.createElement(DeviceControlComponent, { disabled: false, key: control.id, control: control, socket: this.props.socket, colors: colors, deviceId: this.props.device.id, controlHandler: this.props.controlHandler, controlStateHandler: this.props.controlStateHandler }));
        });
    }
    renderControlDialog() {
        if (!this.state.showControlDialog || !this.props.alive) {
            return null;
        }
        const colors = { primary: '#111', secondary: '#888' };
        const allControls = this.props.device.controls || [];
        return (React.createElement(Dialog, { open: !0, onClose: () => this.setState({ showControlDialog: false }) },
            React.createElement(DialogTitle, { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
                this.props.fields.name,
                React.createElement(IconButton, { onClick: () => this.setState({ showControlDialog: false }) },
                    React.createElement(CloseIcon, null))),
            React.createElement(DialogContent, { style: { display: 'flex', flexDirection: 'column' } }, this.renderControlItems(allControls, allControls, colors))));
    }
    renderControls() {
        const colors = { primary: '#111', secondary: '#888' };
        const firstControl = this.props.device.controls?.[0];
        if (this.props.device.controls?.length === 1 &&
            firstControl &&
            (firstControl.type === 'icon' || firstControl.type === 'switch') &&
            !firstControl.label) {
            // control can be placed in the button icon
            return (React.createElement(DeviceControlComponent, { disabled: !this.props.alive, control: firstControl, colors: colors, socket: this.props.socket, deviceId: this.props.device.id, controlHandler: this.props.controlHandler, controlStateHandler: this.props.controlStateHandler }));
        }
        if (this.props.device.controls?.length) {
            // place a button and show a control dialog
            return (React.createElement(Fab, { size: "small", style: { width: 32, height: 32, minHeight: 32 }, disabled: !this.props.alive, onClick: () => this.setState({ showControlDialog: true }) },
                React.createElement(ControlIcon, null)));
        }
        return null;
    }
    /**
     * IDs of all actions that are not rendered as a normal button in the footer, because they
     * already have their place in the status line: the reserved actions, the actions with
     * `placement: 'status'` and the actions referenced by a custom indicator.
     */
    getStatusActionIds() {
        const ids = new Set([ACTIONS.STATUS, ACTIONS.ENABLE_DISABLE, ACTIONS.UPDATE, ACTIONS.BATTERY]);
        for (const indicator of this.props.device.indicators || []) {
            if (indicator.actionId) {
                ids.add(indicator.actionId);
            }
        }
        for (const action of this.props.device.actions || []) {
            if (action.placement === 'status') {
                ids.add(action.id);
            }
        }
        return ids;
    }
    /** True if at least one action is left for the button row at the bottom of the card */
    hasFooterActions() {
        const statusActionIds = this.getStatusActionIds();
        return !!this.props.device.actions?.some(action => !statusActionIds.has(action.id));
    }
    /** Resolve how a custom indicator behaves on click by looking up the referenced action */
    resolveIndicatorAction = (actionId) => {
        const action = this.props.device.actions?.find(a => a.id === actionId);
        if (!action) {
            console.warn(`Indicator of device ${JSON.stringify(this.props.device.id)} references the unknown action "${actionId}"`);
            return undefined;
        }
        if ('url' in action && action.url) {
            return { url: getTranslation(action.url), disabled: action.disabled };
        }
        return {
            onClick: this.props.deviceHandler(this.props.device.id, action),
            disabled: action.disabled,
        };
    };
    /** Custom indicators and the actions that requested to be shown in the status line */
    renderIndicators(small) {
        const reserved = [ACTIONS.STATUS, ACTIONS.ENABLE_DISABLE, ACTIONS.UPDATE, ACTIONS.BATTERY];
        const statusActions = this.props.device.actions?.filter(a => a.placement === 'status' && !reserved.includes(a.id)) || [];
        // An indicator switched off by the user is not shown at all. An action referenced by it stays
        // out of the footer too, as hiding the indicator was an explicit decision of the user.
        const indicators = this.props.hiddenIndicators?.length
            ? this.props.device.indicators?.filter(indicator => !this.props.hiddenIndicators.includes(indicator.id))
            : this.props.device.indicators;
        if (!indicators?.length && !statusActions.length) {
            return null;
        }
        return (React.createElement(StatusIndicators, { indicators: indicators, theme: this.props.theme, stateOrObjectHandler: this.props.stateOrObjectHandler, disabled: !this.props.alive, resolveAction: this.resolveIndicatorAction, style: { marginTop: small ? 2 : 4 } }, statusActions.map(action => (React.createElement(DeviceActionButton, { disabled: !this.props.alive, key: action.id, deviceId: this.props.device.id, action: action, deviceHandler: this.props.deviceHandler })))));
    }
    renderActions() {
        const statusActionIds = this.getStatusActionIds();
        const actions = this.props.device.actions?.filter(a => !statusActionIds.has(a.id));
        return actions?.length
            ? actions.map(a => (React.createElement(DeviceActionButton, { disabled: !this.props.alive, key: a.id, deviceId: this.props.device.id, action: a, deviceHandler: this.props.deviceHandler })))
            : null;
    }
    renderSmall() {
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
                ? this.props.device.status
                : [this.props.device.status];
        const iconSrc = this.state.localIcon || this.props.fields.icon;
        const icon = iconSrc ? (React.createElement(DeviceTypeIcon, { src: iconSrc, style: styles.imgStyle })) : (React.createElement(NoImageIcon, { style: styles.imgStyle }));
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        const title = this.state.details?.data?.name || this.props.device.name || '';
        return (React.createElement(Paper, { style: this.props.fillContainer ? filledCardSize : smallCardSize, sx: styles.cardStyle },
            React.createElement(Box, { sx: headerStyle, style: { ...styles.headerStyle, minHeight: 48 } },
                React.createElement("div", { style: { ...styles.imgAreaStyle, height: 32, width: 32 } },
                    this.props.uploadImagesToInstance ? (React.createElement(DeviceImageUpload, { uploadImagesToInstance: this.props.uploadImagesToInstance, deviceId: this.props.device.id, manufacturer: this.props.fields.manufacturer, model: this.props.fields.model, onImageSelect: (imageData) => {
                            if (imageData) {
                                this.setState({ localIcon: imageData });
                            }
                        }, socket: this.props.socket })) : null,
                    icon),
                React.createElement(Box, { style: { ...styles.titleStyle, fontSize: 14 }, title: title.length > 15 ? title : undefined, sx: theme => ({ color: headerStyle.color || theme.palette.secondary.contrastText }) }, this.state.details?.data?.name || this.props.fields.name),
                this.props.fields.hasDetails ? (React.createElement(Fab, { disabled: !this.props.alive, size: "small", style: styles.detailsButtonStyle, onClick: () => {
                        if (!this.state.open) {
                            this.loadDetails().catch(console.error);
                            this.setState({ open: true });
                        }
                    }, color: "primary" },
                    React.createElement(MoreVertIcon, null))) : null),
            React.createElement("div", { style: { ...styles.statusStyle, height: 'auto', padding: '8px 15px 0 15px' } },
                status.map((s, i) => (React.createElement(DeviceStatusComponent, { key: i, socket: this.props.socket, deviceId: this.props.device.id, connectionType: this.props.fields.connectionType, status: s, enabled: this.props.fields.enabled, statusAction: this.props.device.actions?.find(a => a.id === ACTIONS.STATUS), disableEnableAction: this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE), update: i === 0 ? this.props.device.update : undefined, updateAction: i === 0 ? this.props.device.actions?.find(a => a.id === ACTIONS.UPDATE) : undefined, batteryAction: this.props.device.actions?.find(a => a.id === ACTIONS.BATTERY), deviceHandler: this.props.deviceHandler, theme: this.props.theme, stateOrObjectHandler: this.props.stateOrObjectHandler }))),
                this.renderIndicators(true)),
            React.createElement("div", { style: styles.bodyStyle },
                React.createElement(Typography, { variant: "body2", style: { ...styles.deviceInfoStyle, padding: '10px 10px 0 10px' } },
                    this.props.fields.identifier ? (React.createElement("div", { onClick: this.copyToClipboard, style: { textOverflow: 'ellipsis', overflow: 'hidden' } },
                        React.createElement("b", null,
                            getText(this.props.identifierLabel),
                            ":"),
                        React.createElement("span", { style: { marginLeft: 4 } }, this.props.fields.identifier))) : null,
                    this.props.fields.manufacturer ? (React.createElement(Tooltip, { title: getTranslation('manufacturer'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
                        React.createElement("div", null, this.props.fields.manufacturer))) : null,
                    this.props.fields.model ? (React.createElement(Tooltip, { title: getTranslation('model'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
                        React.createElement("div", null, this.props.fields.model))) : null),
                this.props.device.customInfo ? (React.createElement("div", { style: { padding: '0 10px 10px' } },
                    React.createElement(JsonConfig, { instanceId: this.props.instanceId, socket: this.props.socket, schema: this.props.device.customInfo.schema, data: this.props.device.customInfo.data || {}, onChange: (_data) => {
                            /* ignore */
                        }, themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat }))) : null,
                !!(this.hasFooterActions() || this.props.device.controls?.length) && (React.createElement("div", { style: {
                        marginTop: 'auto',
                        display: 'flex',
                        gap: 4,
                        paddingBottom: 5,
                        minHeight: 34,
                        paddingLeft: 8,
                        paddingRight: 8,
                    } },
                    this.renderActions(),
                    React.createElement("div", { style: { flexGrow: 1 } }),
                    this.renderControls()))),
            this.renderDialog(),
            this.renderControlDialog()));
    }
    getCardHeaderStyle(theme, maxWidth) {
        const backgroundColor = this.props.fields.backgroundColor === 'primary'
            ? theme.palette.primary.main
            : this.props.fields.backgroundColor === 'secondary'
                ? theme.palette.secondary.main
                : this.props.fields.backgroundColor || theme.palette.secondary.main;
        let color;
        if (this.props.fields.color &&
            this.props.fields.color !== 'primary' &&
            this.props.fields.color !== 'secondary') {
            // Color was directly defined
            color = this.props.fields.color;
        }
        else if (this.props.fields.color === 'primary') {
            color = theme.palette.primary.main;
        }
        else if (this.props.fields.color === 'secondary') {
            color = theme.palette.secondary.main;
        }
        else {
            // Color was not defined
            if (this.props.fields.backgroundColor === 'primary') {
                color = theme.palette.primary.contrastText;
            }
            else if (this.props.fields.backgroundColor === 'secondary' || !this.props.fields.backgroundColor) {
                color = theme.palette.secondary.contrastText;
            }
            else {
                color = Utils.invertColor(backgroundColor, true);
            }
        }
        return {
            backgroundColor,
            color,
            maxWidth,
        };
    }
    renderBig() {
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
                ? this.props.device.status
                : [this.props.device.status];
        const iconSrc = this.state.localIcon || this.props.fields.icon;
        const icon = iconSrc ? (React.createElement(DeviceTypeIcon, { src: iconSrc, style: styles.imgStyle })) : (React.createElement(NoImageIcon, { style: styles.imgStyle }));
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        const title = this.state.details?.data?.name || this.props.device.name || '';
        return (React.createElement(Paper, { style: this.props.fillContainer ? filledCardSize : cardSize, sx: styles.cardStyle },
            React.createElement(Box, { sx: headerStyle, style: styles.headerStyle },
                React.createElement("div", { style: styles.imgAreaStyle },
                    this.props.uploadImagesToInstance ? (React.createElement(DeviceImageUpload, { uploadImagesToInstance: this.props.uploadImagesToInstance, deviceId: this.props.device.id, manufacturer: this.props.fields.manufacturer, model: this.props.fields.model, onImageSelect: (imageData) => {
                            if (imageData) {
                                this.setState({ localIcon: imageData });
                            }
                        }, socket: this.props.socket })) : null,
                    icon),
                React.createElement(Box, { style: styles.titleStyle, title: title.length > 20 ? title : undefined, sx: theme => ({ color: headerStyle.color || theme.palette.secondary.contrastText }) }, this.state.details?.data?.name || this.props.fields.name),
                this.props.fields.hasDetails ? (React.createElement(Fab, { disabled: !this.props.alive, size: "small", style: styles.detailsButtonStyle, onClick: () => {
                        if (!this.state.open) {
                            this.loadDetails().catch(console.error);
                            this.setState({ open: true });
                        }
                    }, color: "primary" },
                    React.createElement(MoreVertIcon, null))) : null),
            React.createElement("div", { style: styles.statusStyle },
                status.map((s, i) => (React.createElement(DeviceStatusComponent, { key: i, socket: this.props.socket, deviceId: this.props.device.id, connectionType: this.props.fields.connectionType, status: s, enabled: this.props.fields.enabled, statusAction: this.props.device.actions?.find(a => a.id === ACTIONS.STATUS), disableEnableAction: this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE), update: i === 0 ? this.props.device.update : undefined, updateAction: i === 0 ? this.props.device.actions?.find(a => a.id === ACTIONS.UPDATE) : undefined, batteryAction: this.props.device.actions?.find(a => a.id === ACTIONS.BATTERY), deviceHandler: this.props.deviceHandler, theme: this.props.theme, stateOrObjectHandler: this.props.stateOrObjectHandler }))),
                this.renderIndicators()),
            React.createElement("div", { style: styles.bodyStyle },
                React.createElement(Typography, { variant: "body1", style: styles.deviceInfoStyle },
                    this.props.fields.identifier ? (React.createElement("div", { onClick: this.copyToClipboard },
                        React.createElement("b", { style: { marginRight: 4 } },
                            getText(this.props.identifierLabel),
                            ":"),
                        this.props.fields.identifier)) : null,
                    this.props.fields.manufacturer ? (React.createElement("div", null,
                        React.createElement("b", { style: { marginRight: 4 } },
                            getTranslation('manufacturer'),
                            ":"),
                        this.props.fields.manufacturer)) : null,
                    this.props.fields.model ? (React.createElement("div", null,
                        React.createElement("b", { style: { marginRight: 4 } },
                            getTranslation('model'),
                            ":"),
                        this.props.fields.model)) : null),
                this.props.device.customInfo ? (React.createElement("div", { style: { padding: '0 16px 16px' } },
                    React.createElement(JsonConfig, { instanceId: this.props.instanceId, socket: this.props.socket, schema: this.props.device.customInfo.schema, data: this.props.device.customInfo.data || {}, onChange: (_data) => {
                            /* ignore */
                        }, themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat }))) : null,
                !!(this.hasFooterActions() || this.props.device.controls?.length) && (React.createElement("div", { style: {
                        marginTop: 'auto',
                        display: 'flex',
                        gap: 8,
                        paddingBottom: 5,
                        minHeight: 34,
                        paddingLeft: 10,
                        paddingRight: 10,
                    } },
                    this.renderActions(),
                    React.createElement("div", { style: { flexGrow: 1 } }),
                    this.renderControls()))),
            this.renderDialog(),
            this.renderControlDialog()));
    }
    render() {
        if (this.props.smallCards) {
            return this.renderSmall();
        }
        return this.renderBig();
    }
}
export class DeviceCardSkeleton extends PureComponent {
    render() {
        if (this.props.smallCards) {
            return this.renderSmall();
        }
        return this.renderBig();
    }
    renderSmall() {
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        return (React.createElement(Paper, { sx: styles.cardStyle, style: smallCardSize },
            React.createElement(Box, { sx: headerStyle, style: { ...styles.headerStyle, minHeight: 48 } },
                React.createElement("div", { style: { ...styles.imgAreaStyle, height: 32, width: 32 } },
                    React.createElement(Skeleton, { variant: "rounded", width: 24, height: 24 })),
                React.createElement(Box, { style: { ...styles.titleStyle, fontSize: 14, minWidth: '50%' }, sx: theme => ({
                        color: headerStyle.color || theme.palette.secondary.contrastText,
                    }) },
                    React.createElement(Skeleton, null))),
            React.createElement("div", { style: { ...styles.statusStyle, height: 'auto', padding: '8px 15px 0 15px' } }),
            React.createElement("div", { style: styles.bodyStyle },
                React.createElement(Typography, { variant: "body2", style: { ...styles.deviceInfoStyle, padding: '10px 10px 0 10px' } },
                    React.createElement("div", null,
                        React.createElement(Skeleton, null)),
                    React.createElement("div", null,
                        React.createElement(Skeleton, null)),
                    React.createElement("div", null,
                        React.createElement(Skeleton, null))))));
    }
    renderBig() {
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        return (React.createElement(Paper, { sx: styles.cardStyle, style: cardSize },
            React.createElement(Box, { sx: headerStyle, style: styles.headerStyle },
                React.createElement("div", { style: styles.imgAreaStyle },
                    React.createElement(Skeleton, { variant: "rounded", width: 24, height: 24 })),
                React.createElement(Box, { style: styles.titleStyle, sx: theme => ({
                        color: headerStyle.color || theme.palette.secondary.contrastText,
                        minWidth: '50%',
                    }) },
                    React.createElement(Skeleton, null))),
            React.createElement("div", { style: styles.statusStyle }),
            React.createElement("div", { style: styles.bodyStyle },
                React.createElement(Typography, { variant: "body1", style: styles.deviceInfoStyle },
                    React.createElement("div", null,
                        React.createElement(Skeleton, null)),
                    React.createElement("div", null,
                        React.createElement(Skeleton, null)),
                    React.createElement("div", null,
                        React.createElement(Skeleton, null))))));
    }
    // eslint-disable-next-line class-methods-use-this
    getCardHeaderStyle(theme, maxWidth) {
        const backgroundColor = theme.palette.secondary.main;
        const color = theme.palette.secondary.contrastText;
        return {
            backgroundColor,
            color,
            maxWidth,
        };
    }
}
//# sourceMappingURL=DeviceCard.js.map