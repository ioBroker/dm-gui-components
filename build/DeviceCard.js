import { DeviceTypeIcon, I18n, Utils, } from '@iobroker/adapter-react-v5';
import { Close as CloseIcon, VideogameAsset as ControlIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, Fab, IconButton, Paper, Skeleton, Typography, } from '@mui/material';
import React, { Component } from 'react';
import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceImageUpload from './DeviceImageUpload';
import DeviceStatusComponent from './DeviceStatus';
import JsonConfig from './JsonConfig';
import { getTranslation } from './Utils';
import { StateOrObjectHandler } from './StateOrObjectHandler';
const smallCardStyle = {
    maxWidth: 345,
    minWidth: 200,
};
/** Reserved action names (this is copied from https://github.com/ioBroker/dm-utils/blob/main/src/types/base.ts as we can only have type references to dm-utils) */
const ACTIONS = {
    /** This action will be called when the user clicks on the connection icon */
    STATUS: 'status',
    /** This action will be called when the user clicks on the enabled / disabled icon. The enabled/disabled icon will be shown only if the node status has the "enabled" flag set to false or true */
    ENABLE_DISABLE: 'enable/disable',
};
const styles = {
    cardStyle: {
        width: 300,
        minHeight: 280,
        margin: 10,
        overflow: 'hidden',
        display: 'inline-block',
    },
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
        height: 'calc(100% - 116px)',
    },
    deviceInfoStyle: {
        padding: '20px 16px 0 16px',
        height: 133,
    },
    statusStyle: {
        padding: '15px 25px 0 15px',
        height: 41,
    },
};
function NoImageIcon(props) {
    return (React.createElement("svg", { viewBox: "0 0 24 24", width: "24", height: "24", style: props.style, className: props.className },
        React.createElement("path", { fill: "currentColor", d: "M21.9,21.9l-8.49-8.49l0,0L3.59,3.59l0,0L2.1,2.1L0.69,3.51L3,5.83V19c0,1.1,0.9,2,2,2h13.17l2.31,2.31L21.9,21.9z M5,18 l3.5-4.5l2.5,3.01L12.17,15l3,3H5z M21,18.17L5.83,3H19c1.1,0,2,0.9,2,2V18.17z" })));
}
function getText(text) {
    if (typeof text === 'object') {
        return text[I18n.getLanguage()] || text.en;
    }
    return text;
}
/**
 * Device Card Component
 */
export default class DeviceCard extends Component {
    stateOrObjectHandler;
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            details: null,
            data: {},
            showControlDialog: false,
        };
        this.stateOrObjectHandler = new StateOrObjectHandler(this.props.socket);
    }
    async fetchIcon() {
        if (!this.props.device.icon) {
            const manufacturer = this.state.manufacturer;
            const model = this.state.model;
            // try to load the icon from file storage
            const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || JSON.stringify(this.props.device.id)}`;
            try {
                const file = await this.props.socket.readFile(this.props.instanceId.replace('system.adapter.', ''), `${fileName}.webp`, true);
                if (file) {
                    this.setState({ icon: `data:${file.mimeType};base64,${file.file}` });
                }
                else {
                    this.setState({ icon: '' });
                }
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
                if (this.state.icon) {
                    this.setState({ icon: '' });
                }
            }
        }
    }
    async componentDidMount() {
        await this.stateOrObjectHandler.addListener(this.props.device.name, value => {
            this.setState({ name: getText(value) });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.identifier, value => {
            this.setState({ identifier: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.hasDetails, value => {
            this.setState({ hasDetails: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.icon, value => {
            this.setState({ icon: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.backgroundColor, value => {
            this.setState({ backgroundColor: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.color, value => {
            this.setState({ color: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.manufacturer, value => {
            this.setState({ manufacturer: getText(value) });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.model, value => {
            this.setState({ model: getText(value) });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.connectionType, value => {
            this.setState({ connectionType: value });
        });
        await this.stateOrObjectHandler.addListener(this.props.device.enabled, value => {
            this.setState({ enabled: value });
        });
        await this.fetchIcon().catch(e => console.error(e));
    }
    async componentWillUnmount() {
        await this.stateOrObjectHandler.unsubscribe();
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
     * Refresh the device details
     */
    refresh = () => {
        this.setState({ details: null });
        this.loadDetails().catch(console.error);
    };
    /**
     * Copy the device ID to the clipboard
     */
    copyToClipboard = () => {
        const textToCopy = this.state.identifier;
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
                React.createElement(JsonConfig, { instanceId: this.props.instanceId, socket: this.props.socket, schema: this.state.details.schema, data: this.state.data, onChange: (data) => this.setState({ data }), themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat })),
            React.createElement(DialogActions, null,
                React.createElement(Button, { disabled: !this.props.alive, variant: "contained", color: "primary", onClick: () => this.setState({ open: false }), autoFocus: true }, getTranslation('closeButtonText')))));
    }
    renderControlDialog() {
        if (!this.state.showControlDialog || !this.props.alive) {
            return null;
        }
        const colors = { primary: '#111', secondary: '#888' };
        return (React.createElement(Dialog, { open: !0, onClose: () => this.setState({ showControlDialog: false }) },
            React.createElement(DialogTitle, null,
                this.state.name,
                React.createElement(IconButton, { style: {
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        zIndex: 10,
                    }, onClick: () => this.setState({ showControlDialog: false }) },
                    React.createElement(CloseIcon, null))),
            React.createElement(DialogContent, { style: { display: 'flex', flexDirection: 'column' } }, this.props.device.controls?.map(control => (React.createElement(DeviceControlComponent, { disabled: false, key: control.id, control: control, socket: this.props.socket, colors: colors, deviceId: this.props.device.id, controlHandler: this.props.controlHandler, controlStateHandler: this.props.controlStateHandler }))))));
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
            // place a button and show a controls dialog
            return (React.createElement(Fab, { size: "small", disabled: !this.props.alive, onClick: () => this.setState({ showControlDialog: true }) },
                React.createElement(ControlIcon, null)));
        }
        return null;
    }
    renderActions() {
        const actions = this.props.device.actions?.filter(a => a.id !== ACTIONS.STATUS && a.id !== ACTIONS.ENABLE_DISABLE);
        return actions?.length
            ? actions.map(a => (React.createElement(DeviceActionButton, { disabled: !this.props.alive, key: a.id, deviceId: this.props.device.id, action: a, deviceHandler: this.props.deviceHandler, refresh: this.refresh })))
            : null;
    }
    renderSmall() {
        const hasDetails = this.state.hasDetails;
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
                ? this.props.device.status
                : [this.props.device.status];
        const icon = this.state.icon ? React.createElement(DeviceTypeIcon, { src: this.state.icon }) : React.createElement(NoImageIcon, null);
        const headerStyle = this.getCardHeaderStyle(this.props.theme, 345);
        return (React.createElement(Card, { sx: smallCardStyle },
            React.createElement(CardHeader, { style: headerStyle, avatar: React.createElement("div", null,
                    this.props.uploadImagesToInstance ? (React.createElement(DeviceImageUpload, { uploadImagesToInstance: this.props.uploadImagesToInstance, deviceId: this.props.device.id, manufacturer: this.state.manufacturer, model: this.state.model, onImageSelect: (imageData) => {
                            if (imageData) {
                                this.setState({ icon: imageData });
                            }
                        }, socket: this.props.socket })) : null,
                    icon), action: hasDetails ? (React.createElement(IconButton, { "aria-label": "settings", onClick: () => {
                        if (!this.state.open) {
                            this.loadDetails().catch(console.error);
                            this.setState({ open: true });
                        }
                    } },
                    React.createElement(MoreVertIcon, null))) : null, title: this.state.name, subheader: this.state.manufacturer ? (React.createElement("span", null,
                    React.createElement("b", { style: { marginRight: 4 } },
                        getTranslation('manufacturer'),
                        ":"),
                    this.state.manufacturer)) : null }),
            React.createElement(CardContent, { style: { position: 'relative' } },
                status?.length ? (React.createElement("div", { style: {
                        display: 'flex',
                        position: 'absolute',
                        top: -11,
                        background: '#88888880',
                        padding: '0 8px',
                        borderRadius: 5,
                        width: 'calc(100% - 46px)',
                    } }, status.map((s, i) => (React.createElement(DeviceStatusComponent, { key: i, socket: this.props.socket, status: s, connectionType: this.state.connectionType, enabled: this.state.enabled, deviceId: this.props.device.id, statusAction: this.props.device.actions?.find(a => a.id === ACTIONS.STATUS), disableEnableAction: this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE), deviceHandler: this.props.deviceHandler, refresh: this.refresh, theme: this.props.theme, stateOrObjectHandler: this.stateOrObjectHandler }))))) : null,
                React.createElement("div", null,
                    React.createElement(Typography, { variant: "body1" },
                        this.state.identifier ? (React.createElement("div", { onClick: this.copyToClipboard, style: { textOverflow: 'ellipsis', overflow: 'hidden' } },
                            React.createElement("b", null,
                                getText(this.props.identifierLabel),
                                ":"),
                            React.createElement("span", { style: { marginLeft: 4 } }, this.state.identifier))) : null,
                        this.state.manufacturer ? (React.createElement("div", null,
                            React.createElement("b", { style: { marginRight: 4 } },
                                getTranslation('manufacturer'),
                                ":"),
                            this.state.manufacturer)) : null,
                        this.state.model ? (React.createElement("div", null,
                            React.createElement("b", { style: { marginRight: 4 } },
                                getTranslation('model'),
                                ":"),
                            this.state.model)) : null))),
            React.createElement(CardActions, { disableSpacing: true },
                this.renderActions(),
                React.createElement("div", { style: { flexGrow: 1 } }),
                this.renderControls()),
            this.renderDialog(),
            this.renderControlDialog()));
    }
    getCardHeaderStyle(theme, maxWidth) {
        const backgroundColor = this.state.backgroundColor === 'primary'
            ? theme.palette.primary.main
            : this.state.backgroundColor === 'secondary'
                ? theme.palette.secondary.main
                : this.state.backgroundColor || theme.palette.secondary.main;
        let color;
        if (this.state.color && this.state.color !== 'primary' && this.state.color !== 'secondary') {
            // Color was directly defined
            color = this.state.color;
        }
        else if (this.state.color === 'primary') {
            color = theme.palette.primary.main;
        }
        else if (this.state.color === 'secondary') {
            color = theme.palette.secondary.main;
        }
        else {
            // Color was not defined
            if (this.state.backgroundColor === 'primary') {
                color = theme.palette.primary.contrastText;
            }
            else if (this.state.backgroundColor === 'secondary' || !this.state.backgroundColor) {
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
        const icon = this.state.icon ? (React.createElement(DeviceTypeIcon, { src: this.state.icon, style: styles.imgStyle })) : (React.createElement(NoImageIcon, { style: styles.imgStyle }));
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        const title = this.state.details?.data?.name || this.props.device.name || '';
        return (React.createElement(Paper, { style: styles.cardStyle, key: JSON.stringify(this.props.id) },
            React.createElement(Box, { sx: headerStyle, style: styles.headerStyle },
                React.createElement("div", { style: styles.imgAreaStyle },
                    this.props.uploadImagesToInstance ? (React.createElement(DeviceImageUpload, { uploadImagesToInstance: this.props.uploadImagesToInstance, deviceId: this.props.device.id, manufacturer: this.state.manufacturer, model: this.state.model, onImageSelect: (imageData) => {
                            if (imageData) {
                                this.setState({ icon: imageData });
                            }
                        }, socket: this.props.socket })) : null,
                    icon),
                React.createElement(Box, { style: styles.titleStyle, title: title.length > 20 ? title : undefined, sx: theme => ({ color: headerStyle.color || theme.palette.secondary.contrastText }) }, this.state.details?.data?.name || this.state.name),
                this.state.hasDetails ? (React.createElement(Fab, { disabled: !this.props.alive, size: "small", style: styles.detailsButtonStyle, onClick: () => {
                        if (!this.state.open) {
                            this.loadDetails().catch(console.error);
                            this.setState({ open: true });
                        }
                    }, color: "primary" },
                    React.createElement(MoreVertIcon, null))) : null),
            React.createElement("div", { style: styles.statusStyle }, status.map((s, i) => (React.createElement(DeviceStatusComponent, { key: i, socket: this.props.socket, deviceId: this.props.device.id, connectionType: this.state.connectionType, status: s, enabled: this.state.enabled, statusAction: this.props.device.actions?.find(a => a.id === ACTIONS.STATUS), disableEnableAction: this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE), deviceHandler: this.props.deviceHandler, refresh: this.refresh, theme: this.props.theme, stateOrObjectHandler: this.stateOrObjectHandler })))),
            React.createElement("div", { style: styles.bodyStyle },
                React.createElement(Typography, { variant: "body1", style: styles.deviceInfoStyle },
                    this.state.identifier ? (React.createElement("div", { onClick: this.copyToClipboard },
                        React.createElement("b", { style: { marginRight: 4 } },
                            getText(this.props.identifierLabel),
                            ":"),
                        this.state.identifier)) : null,
                    this.state.manufacturer ? (React.createElement("div", null,
                        React.createElement("b", { style: { marginRight: 4 } },
                            getTranslation('manufacturer'),
                            ":"),
                        this.state.manufacturer)) : null,
                    this.state.model ? (React.createElement("div", null,
                        React.createElement("b", { style: { marginRight: 4 } },
                            getTranslation('model'),
                            ":"),
                        this.state.model)) : null),
                !!this.props.device.actions?.length && (React.createElement("div", { style: {
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        gap: 8,
                        paddingBottom: 5,
                        height: 34,
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
        const name = this.state.name?.toLowerCase() ?? '';
        if (this.props.filter && !name.includes(this.props.filter.toLowerCase())) {
            return React.createElement(React.Fragment, null);
        }
        if (this.props.smallCards) {
            return this.renderSmall();
        }
        return this.renderBig();
    }
}
export class DeviceCardSkeleton extends Component {
    render() {
        if (this.props.smallCards) {
            return this.renderSmall();
        }
        return this.renderBig();
    }
    renderSmall() {
        const headerStyle = this.getCardHeaderStyle(this.props.theme, 345);
        return (React.createElement(Card, { sx: smallCardStyle },
            React.createElement(CardHeader, { style: headerStyle, avatar: React.createElement("div", null,
                    React.createElement(Skeleton, { variant: "rounded", width: 24, height: 24 })), title: React.createElement(Skeleton, null), subheader: React.createElement(Skeleton, null) }),
            React.createElement(CardContent, { style: { position: 'relative' } },
                React.createElement("div", null,
                    React.createElement(Typography, { variant: "body1" },
                        React.createElement("div", null,
                            React.createElement(Skeleton, null)),
                        React.createElement("div", null,
                            React.createElement(Skeleton, null)),
                        React.createElement("div", null,
                            React.createElement(Skeleton, null)))))));
    }
    renderBig() {
        const headerStyle = this.getCardHeaderStyle(this.props.theme);
        return (React.createElement(Paper, { style: styles.cardStyle },
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