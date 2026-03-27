import { I18n, Icon, Utils, } from '@iobroker/adapter-react-v5';
import { Check, Close, ContentCopy } from '@mui/icons-material';
import { Backdrop, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, Grid2, IconButton, Input, InputAdornment, InputLabel, LinearProgress, MenuItem, Select, Slider, Snackbar, TextField, Typography, } from '@mui/material';
import React, { Component } from 'react';
import JsonConfig from './JsonConfig';
import { DmProtocolV1 } from './protocol/DmProtocolV1';
import { DmProtocolV2 } from './protocol/DmProtocolV2';
import { DmProtocolV3 } from './protocol/DmProtocolV3';
import { UnknownDmProtocol } from './protocol/UnknownDmProtocol';
import { getTranslation } from './Utils';
/**
 * Communication Component
 */
export default class Communication extends Component {
    protocol = new UnknownDmProtocol();
    responseTimeout = null;
    // eslint-disable-next-line react/no-unused-class-component-methods
    instanceHandler;
    // eslint-disable-next-line react/no-unused-class-component-methods
    deviceHandler;
    // eslint-disable-next-line react/no-unused-class-component-methods
    controlHandler;
    // eslint-disable-next-line react/no-unused-class-component-methods
    controlStateHandler;
    constructor(props) {
        super(props);
        this.state = {
            showSpinner: false,
            showToast: null,
            message: null,
            confirm: null,
            form: null,
            progress: null,
            showConfirmation: null,
            showInput: null,
            inputValue: null,
            selectedInstance: this.props.selectedInstance ?? (window.localStorage.getItem('dmSelectedInstance') || ''),
        };
        // eslint-disable-next-line react/no-unused-class-component-methods
        this.instanceHandler = action => () => {
            if (action.confirmation) {
                this.setState({ showConfirmation: action });
                return;
            }
            if (action.inputBefore) {
                this.setState({ showInput: action });
                return;
            }
            this.sendActionToInstance('dm:instanceAction', { actionId: action.id, timeout: action.timeout });
        };
        // eslint-disable-next-line react/no-unused-class-component-methods
        this.deviceHandler = (deviceId, action) => () => {
            if (action.confirmation) {
                this.setState({ showConfirmation: { ...action, deviceId } });
                return;
            }
            if (action.inputBefore) {
                this.setState({
                    showInput: { ...action, deviceId },
                    inputValue: action.inputBefore.defaultValue || '',
                });
                return;
            }
            this.sendActionToInstance('dm:deviceAction', { deviceId, actionId: action.id, timeout: action.timeout });
        };
        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlHandler = (deviceId, control, state) => () => this.sendControlToInstance('dm:deviceControl', { deviceId, controlId: control.id, state });
        // eslint-disable-next-line react/no-unused-class-component-methods
        this.controlStateHandler = (deviceId, control) => () => this.sendControlToInstance('dm:deviceControlState', { deviceId, controlId: control.id });
        this.props.registerHandler?.(() => this.loadDeviceList());
    }
    componentWillUnmount() {
        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
    }
    // eslint-disable-next-line class-methods-use-this
    loadAllData() {
        console.error('loadAllData not implemented');
        return Promise.resolve();
    }
    // eslint-disable-next-line class-methods-use-this
    loadDeviceList() {
        console.error('loadDeviceList not implemented');
    }
    // eslint-disable-next-line class-methods-use-this
    updateDevice(_update) {
        console.error('updateDevice not implemented');
    }
    // eslint-disable-next-line class-methods-use-this
    deleteDevice(_deviceId) {
        console.error('deleteDevice not implemented');
    }
    sendActionToInstance = (command, messageToSend) => {
        const send = async () => {
            this.setState({ showSpinner: true });
            this.responseTimeout = setTimeout(() => {
                this.setState({ showSpinner: false });
                window.alert(I18n.t('ra_No response from the backend'));
            }, messageToSend.timeout || 5000);
            const response = await this.protocol.sendAction(command, messageToSend);
            if (this.responseTimeout) {
                clearTimeout(this.responseTimeout);
                this.responseTimeout = null;
            }
            const type = response.type;
            console.log(`Response: ${type}`);
            switch (response.type) {
                case 'message': {
                    const message = getTranslation(response.message);
                    console.log(`Message received: ${message}`);
                    if (message) {
                        this.setState({
                            message: {
                                message,
                                handleClose: () => this.setState({ message: null }, () => this.sendActionToInstance('dm:actionProgress', { origin: response.origin })),
                            },
                            showSpinner: false,
                        });
                    }
                    break;
                }
                case 'confirm': {
                    const message = getTranslation(response.confirm);
                    console.log(`Confirm received: ${message}`);
                    if (message) {
                        this.setState({
                            confirm: {
                                message: message,
                                handleClose: (confirm) => this.setState({ confirm: null }, () => this.sendActionToInstance('dm:actionProgress', {
                                    origin: response.origin,
                                    confirm,
                                })),
                            },
                            showSpinner: false,
                        });
                    }
                    break;
                }
                case 'form':
                    console.log('Form received');
                    if (response.form) {
                        const data = response.form.data;
                        const originalData = {};
                        if (data) {
                            Object.keys(data).forEach(key => {
                                if (data[key] !== undefined) {
                                    originalData[key] = data[key];
                                }
                            });
                        }
                        response.form.data = JSON.parse(JSON.stringify(originalData));
                        this.setState({
                            form: {
                                ...response.form,
                                changed: false,
                                originalData: JSON.stringify(originalData),
                                handleClose: (data) => this.setState({ form: null }, () => {
                                    console.log(`Form ${JSON.stringify(data)}`);
                                    this.sendActionToInstance('dm:actionProgress', {
                                        origin: response.origin,
                                        data,
                                    });
                                }),
                            },
                            showSpinner: false,
                        });
                    }
                    break;
                case 'progress':
                    console.log('Progress received', response.progress);
                    if (response.progress) {
                        if (response.progress.open === false) {
                            this.setState({ progress: null, showSpinner: false });
                        }
                        else if (this.state.progress) {
                            const progress = { ...this.state.progress, ...response.progress };
                            this.setState({ progress, showSpinner: false });
                        }
                        else {
                            this.setState({ progress: response.progress, showSpinner: false });
                        }
                    }
                    this.sendActionToInstance('dm:actionProgress', { origin: response.origin });
                    break;
                case 'result':
                    console.log('Response content', response.result);
                    if ('refresh' in response.result && response.result.refresh) {
                        if (response.result.refresh === true || response.result.refresh === 'all') {
                            console.log('Refreshing all');
                            await this.loadAllData();
                        }
                        else if (response.result.refresh === 'instance') {
                            console.log(`Refreshing instance infos: ${this.state.selectedInstance}`);
                            await this.loadInstanceInfos();
                        }
                        else if (response.result.refresh === 'devices') {
                            console.log('Refreshing devices');
                            this.loadDeviceList();
                        }
                        else {
                            console.log('Not refreshing anything');
                        }
                    }
                    else if ('update' in response.result && response.result.update) {
                        console.log('Update received', response.result.update);
                        this.updateDevice(response.result.update);
                    }
                    else if ('delete' in response.result && response.result.delete) {
                        console.log('Delete received', response.result.delete);
                        this.deleteDevice(response.result.delete);
                    }
                    if ('error' in response.result && response.result.error) {
                        console.error(`Error: ${response.result.error.message}`);
                        this.setState({ showToast: response.result.error.message, showSpinner: false });
                    }
                    else {
                        this.setState({ showSpinner: false });
                    }
                    break;
                default:
                    console.log(`Unknown response type: ${type}`);
                    this.setState({ showSpinner: false });
                    break;
            }
        };
        void send().catch(console.error);
    };
    sendControlToInstance = async (command, messageToSend) => {
        const response = await this.protocol.sendControl(command, messageToSend);
        const type = response.type;
        console.log(`Response: ${response.type}`);
        if (response.type === 'result') {
            console.log('Response content', response.result);
            if ('error' in response.result) {
                console.error(`Error: ${response.result.error.message}`);
                this.setState({ showToast: response.result.error.message });
            }
            else if (response.result.state !== undefined) {
                return response.result.state;
            }
        }
        else {
            console.warn('Unexpected response type', type);
        }
        return null;
    };
    // eslint-disable-next-line react/no-unused-class-component-methods
    loadDevices(callback) {
        return this.protocol.loadDevices(callback);
    }
    async loadInstanceInfos() {
        if (!this.state.selectedInstance) {
            throw new Error('No instance selected');
        }
        const details = await this.props.socket.sendTo(this.state.selectedInstance, 'dm:instanceInfo');
        console.log('Instance details of', this.state.selectedInstance, details);
        if (details.apiVersion === 'v1') {
            this.protocol = new DmProtocolV1(this.state.selectedInstance, this.props.socket);
        }
        else if (details.apiVersion === 'v2') {
            this.protocol = new DmProtocolV2(this.state.selectedInstance, this.props.socket);
        }
        else if (details.apiVersion === 'v3') {
            this.protocol = new DmProtocolV3(this.state.selectedInstance, this.props.socket);
        }
        else {
            this.protocol = new UnknownDmProtocol();
        }
        return this.protocol.convertInstanceDetails(details);
    }
    renderMessageDialog() {
        if (!this.state.message) {
            return null;
        }
        const message = this.state.message;
        return (React.createElement(Dialog, { open: !0, onClose: () => message.handleClose(), hideBackdrop: true, "aria-describedby": "message-dialog-description" },
            React.createElement(DialogContent, null,
                React.createElement(DialogContentText, { id: "message-dialog-description" }, message.message)),
            React.createElement(DialogActions, null,
                React.createElement(Button, { color: "primary", onClick: () => message.handleClose(), variant: "contained", autoFocus: true }, getTranslation('okButtonText')))));
    }
    renderConfirmDialog() {
        if (!this.state.confirm) {
            return null;
        }
        const confirm = this.state.confirm;
        return (React.createElement(Dialog, { open: !0, onClose: () => confirm.handleClose(), hideBackdrop: true, "aria-describedby": "confirm-dialog-description" },
            React.createElement(DialogContent, null,
                React.createElement(DialogContentText, { id: "confirm-dialog-description" }, getTranslation(confirm.message))),
            React.createElement(DialogActions, null,
                React.createElement(Button, { variant: "contained", color: "primary", onClick: () => confirm.handleClose(true), autoFocus: true }, getTranslation('yesButtonText')),
                React.createElement(Button, { variant: "contained", color: "grey", onClick: () => confirm.handleClose(false), autoFocus: true }, getTranslation('noButtonText')))));
    }
    renderSnackbar() {
        return (React.createElement(Snackbar, { open: !!this.state.showToast, autoHideDuration: 6_000, onClose: () => this.setState({ showToast: null }), message: this.state.showToast }));
    }
    getOkButton(button) {
        if (typeof button === 'string') {
            button = undefined;
        }
        // TODO: detect if any input fields are present and if no one, do not disable the button
        return (React.createElement(Button, { key: "apply", disabled: !this.state.form?.changed && !this.state.form?.ignoreApplyDisabled, variant: button?.variant || 'contained', color: button?.color === 'primary' ? 'primary' : button?.color === 'secondary' ? 'secondary' : 'primary', style: {
                backgroundColor: button?.color && button?.color !== 'primary' && button?.color !== 'secondary'
                    ? button?.color
                    : undefined,
                ...(button?.style || undefined),
            }, onClick: () => this.state.form?.handleClose && this.state.form.handleClose(this.state.form?.data), startIcon: button?.icon ? React.createElement(Icon, { src: button?.icon }) : undefined }, getTranslation(button?.label || 'okButtonText', button?.noTranslation)));
    }
    getCancelButton(button) {
        let isClose = false;
        if (typeof button === 'string') {
            isClose = button === 'close';
            button = undefined;
        }
        return (React.createElement(Button, { key: "cancel", variant: button?.variant || 'contained', color: button?.color === 'primary' ? 'primary' : button?.color === 'secondary' ? 'secondary' : 'grey', style: {
                backgroundColor: button?.color && button?.color !== 'primary' && button?.color !== 'secondary'
                    ? button?.color
                    : undefined,
                ...(button?.style || undefined),
            }, onClick: () => this.state.form?.handleClose && this.state.form.handleClose(), startIcon: isClose ? React.createElement(Close, null) : button?.icon ? React.createElement(Icon, { src: button?.icon }) : undefined }, getTranslation(button?.label || 'cancelButtonText', button?.noTranslation)));
    }
    renderFormDialog() {
        if (!this.state.form?.schema) {
            return null;
        }
        if (!this.state.selectedInstance) {
            throw new Error('No instance selected');
        }
        const form = this.state.form;
        let buttons;
        if (form.buttons) {
            buttons = [];
            form.buttons.forEach((button) => {
                if (typeof button === 'object' && button.type === 'copyToClipboard') {
                    buttons.push(React.createElement(Button, { key: "copyToClipboard", variant: button.variant || 'outlined', color: button.color === 'primary'
                            ? 'primary'
                            : button.color === 'secondary'
                                ? 'secondary'
                                : undefined, style: {
                            backgroundColor: button.color && button.color !== 'primary' && button.color !== 'secondary'
                                ? button.color
                                : undefined,
                            ...(button.style || undefined),
                        }, onClick: () => {
                            if (button.copyToClipboardAttr && form.data) {
                                const val = form.data[button.copyToClipboardAttr];
                                if (typeof val === 'string') {
                                    Utils.copyToClipboard(val);
                                }
                                else {
                                    Utils.copyToClipboard(JSON.stringify(val, null, 2));
                                }
                                window.alert(I18n.t('copied'));
                            }
                            else if (form.data) {
                                Utils.copyToClipboard(JSON.stringify(form.data, null, 2));
                                window.alert(I18n.t('copied'));
                            }
                            else {
                                window.alert(I18n.t('nothingToCopy'));
                            }
                        }, startIcon: button?.icon ? React.createElement(Icon, { src: button?.icon }) : React.createElement(ContentCopy, null) }, getTranslation(button?.label || 'ctcButtonText', button?.noTranslation)));
                }
                else if (button === 'apply' || button.type === 'apply') {
                    buttons.push(this.getOkButton(button));
                }
                else {
                    buttons.push(this.getCancelButton(button));
                }
            });
        }
        else {
            buttons = [this.getOkButton(), this.getCancelButton()];
        }
        return (React.createElement(Dialog, { onClose: () => form.handleClose?.(), hideBackdrop: true, fullWidth: true, open: true, sx: {
                '& .MuiDialog-paper': {
                    minWidth: form.minWidth || undefined,
                },
            }, maxWidth: form.maxWidth || 'md' },
            form.title ? (React.createElement(DialogTitle, null, getTranslation(form.label || form.title, form.noTranslation))) : null,
            React.createElement(DialogContent, null,
                React.createElement(JsonConfig, { instanceId: this.state.selectedInstance, schema: form.schema, data: form.data || {}, socket: this.props.socket, onChange: (data) => {
                        console.log('handleFormChange', { data });
                        if (form) {
                            form.data = data;
                            form.changed = JSON.stringify(data) !== form.originalData;
                            this.setState({ form });
                        }
                    }, themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat })),
            React.createElement(DialogActions, null, buttons)));
    }
    renderProgressDialog() {
        if (!this.state.progress) {
            return null;
        }
        return (React.createElement(Dialog, { onClose: () => { }, hideBackdrop: true, open: true },
            this.state.progress.title && React.createElement(DialogTitle, null, getTranslation(this.state.progress.title)),
            React.createElement(DialogContent, null,
                this.state.progress.label && (React.createElement(DialogContentText, null, getTranslation(this.state.progress.label))),
                React.createElement(LinearProgress, { variant: this.state.progress.indeterminate ? 'indeterminate' : 'determinate', value: this.state.progress.value }))));
    }
    // eslint-disable-next-line class-methods-use-this
    renderContent() {
        return null;
    }
    renderSpinner() {
        if (!this.state.showSpinner) {
            return null;
        }
        return (React.createElement(Backdrop, { style: { zIndex: 1000 }, open: true },
            React.createElement(CircularProgress, null)));
    }
    renderConfirmationDialog() {
        if (!this.state.showConfirmation) {
            return null;
        }
        return (React.createElement(Dialog, { onClose: () => this.setState({ showConfirmation: null }), open: true },
            React.createElement(DialogTitle, null, getTranslation(this.state.showConfirmation.confirmation === true
                ? getTranslation('areYouSureText')
                : getTranslation(this.state.showConfirmation.confirmation))),
            React.createElement(DialogActions, null,
                React.createElement(Button, { variant: "contained", color: "primary", onClick: () => {
                        if (!this.state.showConfirmation) {
                            return;
                        }
                        const showConfirmation = this.state.showConfirmation;
                        this.setState({ showConfirmation: null }, () => {
                            if (showConfirmation.deviceId) {
                                this.sendActionToInstance('dm:deviceAction', {
                                    actionId: showConfirmation.id,
                                    deviceId: showConfirmation.deviceId,
                                    timeout: showConfirmation.timeout,
                                });
                            }
                            else {
                                this.sendActionToInstance('dm:instanceAction', {
                                    actionId: showConfirmation.id,
                                    timeout: showConfirmation.timeout,
                                });
                            }
                        });
                    }, autoFocus: true, startIcon: React.createElement(Check, null) }, getTranslation('yesButtonText')),
                React.createElement(Button, { variant: "contained", color: "grey", onClick: () => this.setState({ showConfirmation: null }), startIcon: React.createElement(Close, null) }, getTranslation('cancelButtonText')))));
    }
    onShowInputOk() {
        if (!this.state.showInput) {
            return;
        }
        const showInput = this.state.showInput;
        this.setState({ showInput: null }, () => {
            if (showInput.deviceId) {
                this.sendActionToInstance('dm:deviceAction', {
                    actionId: showInput.id,
                    deviceId: showInput.deviceId,
                    timeout: showInput.timeout,
                    value: showInput.inputBefore?.type === 'checkbox'
                        ? !!this.state.inputValue
                        : showInput.inputBefore?.type === 'number'
                            ? parseFloat(this.state.inputValue) || 0
                            : this.state.inputValue,
                });
            }
            else {
                this.sendActionToInstance('dm:instanceAction', {
                    actionId: showInput.id,
                    timeout: showInput.timeout,
                    value: showInput.inputBefore?.type === 'checkbox'
                        ? !!this.state.inputValue
                        : showInput.inputBefore?.type === 'number'
                            ? parseFloat(this.state.inputValue) || 0
                            : this.state.inputValue,
                });
            }
        });
    }
    renderInputDialog() {
        if (!this.state.showInput || !this.state.showInput.inputBefore) {
            return null;
        }
        let okDisabled = false;
        if (!this.state.showInput.inputBefore.allowEmptyValue && this.state.showInput.inputBefore.type !== 'checkbox') {
            if (this.state.showInput.inputBefore.type === 'number' ||
                this.state.showInput.inputBefore.type === 'slider') {
                okDisabled =
                    this.state.inputValue === '' ||
                        this.state.inputValue === null ||
                        !window.isFinite(this.state.inputValue);
            }
            else {
                okDisabled = !this.state.inputValue;
            }
        }
        return (React.createElement(Dialog, { onClose: () => this.setState({ showInput: null }), open: true },
            React.createElement(DialogTitle, null, getTranslation('pleaseEnterValueText')),
            React.createElement(DialogContent, null,
                this.state.showInput.inputBefore.type === 'text' ||
                    this.state.showInput.inputBefore.type === 'number' ||
                    !this.state.showInput.inputBefore.type ? (React.createElement(TextField, { autoFocus: true, margin: "dense", label: getTranslation(this.state.showInput.inputBefore.label), slotProps: {
                        htmlInput: this.state.showInput.inputBefore.type === 'number'
                            ? {
                                min: this.state.showInput.inputBefore.min,
                                max: this.state.showInput.inputBefore.max,
                                step: this.state.showInput.inputBefore.step,
                            }
                            : undefined,
                        input: {
                            endAdornment: this.state.inputValue ? (React.createElement(InputAdornment, { position: "end" },
                                React.createElement(IconButton, { tabIndex: -1, size: "small", onClick: () => this.setState({ inputValue: '' }) },
                                    React.createElement(Close, null)))) : null,
                        },
                    }, type: this.state.showInput.inputBefore.type === 'number' ? 'number' : 'text', fullWidth: true, value: this.state.inputValue, onChange: e => this.setState({ inputValue: e.target.value }), onKeyUp: (e) => {
                        if (e.key === 'Enter') {
                            this.onShowInputOk();
                        }
                    } })) : null,
                this.state.showInput.inputBefore.type === 'checkbox' ? (React.createElement(FormControlLabel, { control: React.createElement(Checkbox, { checked: !!this.state.inputValue, autoFocus: true, onChange: e => this.setState({ inputValue: e.target.checked }) }), label: getTranslation(this.state.showInput.inputBefore.label) })) : null,
                this.state.showInput.inputBefore.type === 'select' ? (React.createElement(FormControl, { fullWidth: true },
                    React.createElement(InputLabel, null, getTranslation(this.state.showInput.inputBefore.label)),
                    React.createElement(Select, { variant: "standard", value: this.state.inputValue, onChange: e => this.setState({ inputValue: e.target.value }) }, this.state.showInput.inputBefore.options?.map(item => (React.createElement(MenuItem, { key: item.value, value: item.value }, getTranslation(item.label))))))) : null,
                this.state.showInput.inputBefore.type === 'slider' ? (React.createElement(Box, { sx: { width: '100%' } },
                    React.createElement(Typography, { gutterBottom: true }, getTranslation(this.state.showInput.inputBefore.label)),
                    React.createElement(Grid2, { container: true, spacing: 2, alignItems: "center" },
                        React.createElement(Grid2, null,
                            React.createElement(Slider, { value: typeof this.state.inputValue === 'number' ? this.state.inputValue : 0, onChange: (_event, newValue) => this.setState({ inputValue: newValue }) })),
                        React.createElement(Grid2, null,
                            React.createElement(Input, { value: this.state.inputValue, size: "small", onChange: e => this.setState({
                                    inputValue: e.target.value === '' ? 0 : Number(e.target.value),
                                }), onBlur: () => {
                                    if (!this.state.showInput) {
                                        return;
                                    }
                                    const min = this.state.showInput.inputBefore?.min === undefined
                                        ? 0
                                        : this.state.showInput.inputBefore.min;
                                    const max = this.state.showInput.inputBefore?.max === undefined
                                        ? 100
                                        : this.state.showInput.inputBefore.max;
                                    if (this.state.inputValue < min) {
                                        this.setState({ inputValue: min });
                                    }
                                    else if (this.state.inputValue > max) {
                                        this.setState({ inputValue: max });
                                    }
                                }, inputProps: {
                                    step: this.state.showInput.inputBefore.step,
                                    min: this.state.showInput.inputBefore.min === undefined
                                        ? 0
                                        : this.state.showInput.inputBefore.min,
                                    max: this.state.showInput.inputBefore.max === undefined
                                        ? 100
                                        : this.state.showInput.inputBefore.max,
                                    type: 'number',
                                } }))))) : null),
            React.createElement(DialogActions, null,
                React.createElement(Button, { variant: "contained", disabled: okDisabled, color: "primary", onClick: () => this.onShowInputOk(), startIcon: React.createElement(Check, null) }, getTranslation('yesButtonText')),
                React.createElement(Button, { variant: "contained", color: "grey", onClick: () => this.setState({ showInput: null }), startIcon: React.createElement(Close, null) }, getTranslation('cancelButtonText')))));
    }
    render() {
        return (React.createElement(React.Fragment, null,
            this.renderSnackbar(),
            this.renderContent(),
            this.renderConfirmDialog(),
            this.renderMessageDialog(),
            this.renderFormDialog(),
            this.renderProgressDialog(),
            this.renderConfirmationDialog(),
            this.renderInputDialog(),
            this.renderSpinner()));
    }
}
//# sourceMappingURL=Communication.js.map