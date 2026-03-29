import React, { Component } from 'react';
import { Button, Fab, FormControl, InputLabel, MenuItem, Select, Switch, Slider, TextField, InputAdornment, FormControlLabel, } from '@mui/material';
import { Icon } from '@iobroker/adapter-react-v5';
import { renderControlIcon, getTranslation } from './Utils';
/**
 * Device Control component
 */
export default class DeviceControlComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.control.state?.val,
            ts: props.control.state?.ts,
            unit: props.control.unit || '',
        };
    }
    async componentDidMount() {
        if (this.props.control.stateId) {
            const mayBePromise = this.props.socket.subscribeState(this.props.control.stateId, this.stateHandler);
            if (mayBePromise instanceof Promise) {
                await mayBePromise;
            }
            if (this.props.control.type === 'slider' || this.props.control.type === 'number') {
                if (this.props.control.min === undefined && this.props.control.max === undefined) {
                    // read an object to get min and max
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common) {
                            const min = this.props.control.min ?? obj.common.min ?? 0;
                            const max = this.props.control.max ?? obj.common.max ?? 100;
                            const step = this.props.control.step || obj.common.step || (max - min) / 100;
                            let unit = this.props.control.unit;
                            if (unit === undefined) {
                                unit = obj.common.unit;
                            }
                            this.setState({
                                min,
                                max,
                                step,
                                unit,
                            });
                        }
                    });
                }
                else {
                    const min = this.props.control.min ?? 0;
                    const max = this.props.control.max ?? 100;
                    this.setState({
                        min,
                        max,
                        step: this.props.control.step === undefined ? (max - min) / 100 : this.props.control.step,
                        unit: this.props.control.unit || '',
                    });
                }
            }
            else if (this.props.control.type === 'select') {
                if (!this.props.control.options?.length) {
                    // read an object to get options
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common?.states) {
                            let options;
                            if (typeof obj.common.states === 'string') {
                                const pairs = obj.common.states.split(';');
                                options = pairs.map(pair => {
                                    const parts = pair.split(':');
                                    return {
                                        value: parts[0],
                                        label: parts[1],
                                    };
                                });
                            }
                            else if (Array.isArray(obj.common.states)) {
                                options = obj.common.states.map((label) => ({ label, value: label }));
                            }
                            else {
                                options = Object.keys(obj.common.states).map(label => ({
                                    label,
                                    value: obj.common.states[label],
                                }));
                            }
                            this.setState({
                                options,
                            });
                        }
                    });
                }
                else {
                    this.setState({
                        options: this.props.control.options.map(item => ({
                            label: getTranslation(item.label),
                            value: item.value,
                            icon: item.icon,
                            color: item.color,
                        })),
                    });
                }
            }
            else if (this.props.control.type === 'info') {
                if (!this.props.control.unit) {
                    // read an object to get unit
                    void this.props.socket.getObject(this.props.control.stateId).then(obj => {
                        if (obj?.common?.unit) {
                            this.setState({
                                unit: obj.common.unit,
                            });
                        }
                    });
                }
            }
        }
    }
    stateHandler = async (id, state) => {
        if (id === this.props.control.stateId && state) {
            // request new state
            const newState = await this.props.controlStateHandler(this.props.deviceId, this.props.control)();
            if (newState?.ts && (!this.state.ts || newState.ts > this.state.ts)) {
                this.setState({
                    value: newState.val,
                    ts: newState.ts,
                });
            }
        }
    };
    componentWillUnmount() {
        if (this.props.control.stateId) {
            this.props.socket.unsubscribeState(this.props.control.stateId, this.stateHandler);
        }
    }
    static getDerivedStateFromProps(props, state) {
        if (props.control.state?.ts && (!state.ts || props.control.state?.ts > state.ts)) {
            return {
                value: props.control.state.val,
                ts: props.control.state.ts,
            };
        }
        return null;
    }
    async sendControl(deviceId, control, value) {
        const result = await this.props.controlHandler(deviceId, control, value)();
        if (result?.ts && (!this.state.ts || result?.ts > this.state.ts)) {
            this.setState({
                value: result.val,
                ts: result.ts,
            });
        }
    }
    renderButton() {
        const tooltip = getTranslation(this.props.control.description ?? '');
        const icon = renderControlIcon(this.props.control, this.props.colors, this.state.value);
        if (!this.props.control.label) {
            return (React.createElement(Fab, { size: "small", disabled: this.props.disabled, title: tooltip, onClick: () => this.sendControl(this.props.deviceId, this.props.control, true) }, icon));
        }
        return (React.createElement(Button, { disabled: this.props.disabled, title: tooltip, onClick: () => this.sendControl(this.props.deviceId, this.props.control, true), startIcon: icon }, getTranslation(this.props.control.label)));
    }
    renderSwitch() {
        const tooltip = getTranslation(this.props.control.description ?? '');
        if ((this.props.control.label || this.props.control.icon) &&
            (this.props.control.labelOn || this.props.control.iconOn)) {
            return (React.createElement("div", { style: { display: 'flex', gap: 8 } },
                React.createElement("div", { style: { color: this.props.control.color, display: 'flex', gap: 4 } },
                    this.props.control.label ? getTranslation(this.props.control.label) : null,
                    this.props.control.icon ? React.createElement(Icon, { src: this.props.control.icon }) : null),
                React.createElement(Switch, { disabled: this.props.disabled, title: tooltip, checked: !!this.state.value, onChange: e => this.sendControl(this.props.deviceId, this.props.control, e.target.checked) }),
                React.createElement("div", { style: {
                        color: this.props.control.colorOn || this.props.control.color,
                        display: 'flex',
                        gap: 4,
                    } },
                    this.props.control.labelOn ? getTranslation(this.props.control.labelOn) : null,
                    this.props.control.icon ? React.createElement(Icon, { src: this.props.control.icon }) : null)));
        }
        if (this.props.control.label || this.props.control.icon) {
            return (React.createElement(FormControlLabel, { control: React.createElement(Switch, { disabled: this.props.disabled, title: tooltip, checked: !!this.state.value, onChange: e => this.sendControl(this.props.deviceId, this.props.control, e.target.checked) }), slotProps: {
                    typography: {
                        style: { color: this.props.control.color },
                    },
                }, label: React.createElement("span", { style: { color: this.props.control.color, display: 'flex', gap: 4 } },
                    this.props.control.label ? getTranslation(this.props.control.label) : null,
                    this.props.control.icon ? React.createElement(Icon, { src: this.props.control.icon }) : null) }));
        }
        return (React.createElement(Switch, { disabled: this.props.disabled, title: tooltip, checked: !!this.state.value, onChange: e => this.sendControl(this.props.deviceId, this.props.control, e.target.checked) }));
    }
    getColor() {
        let color;
        if (this.state.value) {
            color = this.props.control.colorOn || 'primary';
        }
        else if (this.props.control.type === 'switch') {
            color = this.props.control.color;
        }
        if (color === 'primary') {
            return this.props.colors.primary;
        }
        if (color === 'secondary') {
            return this.props.colors.secondary;
        }
        return color;
    }
    renderSelect() {
        const anyIcons = this.state.options?.some(option => !!option.icon);
        return (React.createElement(FormControl, { fullWidth: true, variant: "standard" },
            this.props.control.label ? React.createElement(InputLabel, null, getTranslation(this.props.control.label)) : null,
            React.createElement(Select, { variant: "standard", value: this.state.value, onChange: (e) => this.sendControl(this.props.deviceId, this.props.control, e.target.value) }, this.state.options?.map((option, i) => (React.createElement(MenuItem, { key: i.toString(), value: typeof option.value === 'boolean' ? option.value.toString() : option.value, style: { color: option.color } },
                anyIcons ? (React.createElement(Icon, { src: option.icon, style: { width: 24, height: 24 } })) : null,
                option.label))))));
    }
    renderSlider() {
        if (this.state.min === undefined || this.state.max === undefined) {
            return React.createElement("div", { style: { width: '100%' } }, "...");
        }
        return (React.createElement("div", { style: {
                width: '100%',
                minWidth: 300,
                paddingTop: 8,
                marginBottom: 8,
                overflow: 'visible',
                display: 'flex',
            } },
            this.props.control.label ? (React.createElement("div", { style: { color: this.props.control.color, marginBottom: 4 } }, getTranslation(this.props.control.label))) : null,
            this.props.control.icon ? (React.createElement(Icon, { style: { color: this.props.control.color }, src: this.props.control.icon })) : null,
            React.createElement(Slider, { style: { flexGrow: 1 }, value: parseFloat(this.state.value || '0'), min: this.state.min, max: this.state.max, step: this.state.step, valueLabelDisplay: "auto", onChange: (_e, value) => this.sendControl(this.props.deviceId, this.props.control, value) }),
            this.props.control.iconOn ? (React.createElement(Icon, { style: { color: this.props.control.colorOn || this.props.control.color }, src: this.props.control.iconOn })) : null,
            this.props.control.labelOn ? (React.createElement("div", { style: { color: this.props.control.colorOn || this.props.control.color } }, getTranslation(this.props.control.labelOn))) : null));
    }
    renderColor() {
        return (React.createElement(TextField, { fullWidth: true, label: this.props.control.label ? getTranslation(this.props.control.label) : undefined, type: "color", value: this.state.value, onChange: (e) => this.sendControl(this.props.deviceId, this.props.control, e.target.value), variant: "standard" }));
    }
    renderText() {
        return (React.createElement(TextField, { fullWidth: true, label: this.props.control.label ? getTranslation(this.props.control.label) : undefined, value: this.state.value, onChange: (e) => this.sendControl(this.props.deviceId, this.props.control, e.target.value), variant: "standard" }));
    }
    renderNumber() {
        return (React.createElement(TextField, { fullWidth: true, type: "number", label: this.props.control.label ? getTranslation(this.props.control.label) : undefined, value: this.state.value, onChange: (e) => {
                if (isNaN(parseFloat(e.target.value))) {
                    return Promise.resolve();
                }
                return this.sendControl(this.props.deviceId, this.props.control, parseFloat(e.target.value));
            }, slotProps: {
                htmlInput: { min: this.state.min, max: this.state.max, step: this.state.step },
                input: {
                    endAdornment: this.state.unit ? (React.createElement(InputAdornment, { position: "end" }, this.state.unit)) : undefined,
                },
            }, variant: "standard" }));
    }
    renderIcon() {
        const tooltip = getTranslation(this.props.control.description ?? '');
        const icon = renderControlIcon(this.props.control, this.props.colors, this.state.value);
        const color = this.getColor();
        const style = color === this.props.colors.primary || color === this.props.colors.secondary ? {} : { color };
        const colorProps = color === this.props.colors.primary
            ? 'primary'
            : color === this.props.colors.secondary
                ? 'secondary'
                : undefined;
        if (!this.props.control.label) {
            style.width = 34;
            style.height = 34;
            style.minHeight = 34;
            return (React.createElement(Fab, { disabled: this.props.disabled, size: "small", title: tooltip, color: colorProps, style: style, onClick: () => this.sendControl(this.props.deviceId, this.props.control, !this.state.value) }, icon));
        }
        return (React.createElement(Button, { disabled: this.props.disabled, title: tooltip, color: colorProps, style: style, onClick: () => this.sendControl(this.props.deviceId, this.props.control, !this.state.value), startIcon: icon }, getTranslation(this.props.control.label)));
    }
    renderInfo() {
        return (React.createElement("div", null,
            this.props.control.label ? React.createElement(InputLabel, null, getTranslation(this.props.control.label)) : null,
            React.createElement("span", null,
                this.state.value,
                React.createElement("span", { style: { fontSize: 'smaller', opacity: 0.7, marginLeft: this.state.unit ? 4 : 0 } }, this.state.unit))));
    }
    render() {
        if (this.props.control.type === 'button') {
            return this.renderButton();
        }
        if (this.props.control.type === 'icon') {
            return this.renderIcon();
        }
        if (this.props.control.type === 'switch') {
            return this.renderSwitch();
        }
        if (this.props.control.type === 'select') {
            return this.renderSelect();
        }
        if (this.props.control.type === 'slider') {
            return this.renderSlider();
        }
        if (this.props.control.type === 'color') {
            return this.renderColor();
        }
        if (this.props.control.type === 'text') {
            return this.renderText();
        }
        if (this.props.control.type === 'number') {
            return this.renderNumber();
        }
        if (this.props.control.type === 'info') {
            return this.renderInfo();
        }
        return React.createElement("div", { style: { color: 'red' } }, this.props.control.type);
    }
}
//# sourceMappingURL=DeviceControl.js.map