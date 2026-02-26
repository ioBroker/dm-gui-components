import { Component, type JSX } from 'react';
import { type Connection } from '@iobroker/adapter-react-v5';
import type { DeviceId, ControlBase, ControlState, DeviceControl } from './protocol/api';
interface DeviceControlProps {
    deviceId: DeviceId;
    /** Control object */
    control: DeviceControl;
    socket: Connection;
    /** Control handler to set the state */
    controlHandler: (deviceId: DeviceId, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;
    /** Control handler to read the state */
    controlStateHandler: (deviceId: DeviceId, control: ControlBase) => () => Promise<ioBroker.State | null>;
    colors: {
        primary: string;
        secondary: string;
    };
    disabled?: boolean;
}
interface DeviceControlState {
    value?: ControlState;
    ts?: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: {
        label: string;
        value: ControlState;
        icon?: string;
        color?: string;
    }[];
}
/**
 * Device Control component
 */
export default class DeviceControlComponent extends Component<DeviceControlProps, DeviceControlState> {
    constructor(props: DeviceControlProps);
    componentDidMount(): Promise<void>;
    stateHandler: (id: string, state: ioBroker.State) => Promise<void>;
    componentWillUnmount(): void;
    static getDerivedStateFromProps(props: DeviceControlProps, state: DeviceControlState): Partial<DeviceControlState> | null;
    sendControl(deviceId: DeviceId, control: ControlBase, value: ControlState): Promise<void>;
    renderButton(): JSX.Element;
    renderSwitch(): JSX.Element;
    getColor(): string | undefined;
    renderSelect(): JSX.Element;
    renderSlider(): JSX.Element;
    renderColor(): JSX.Element;
    renderText(): JSX.Element;
    renderNumber(): JSX.Element;
    renderIcon(): JSX.Element;
    renderInfo(): JSX.Element;
    render(): JSX.Element;
}
export {};
