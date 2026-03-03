import { type Connection, type IobTheme, type ThemeName, type ThemeType } from '@iobroker/adapter-react-v5';
import React, { Component } from 'react';
import type { ActionBase, ActionButton, CommunicationForm, ControlBase, ControlState, DeviceId, InstanceDetails, ProgressUpdate, DeviceInfo } from './protocol/api';
import type { CommandName, LoadDevicesCallback, Message } from './protocol/DmProtocolBase';
declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}
export type CommunicationProps = {
    /** Socket connection */
    socket: Connection;
    /** Instance to communicate with device-manager backend, like `adapterName.X` */
    selectedInstance?: string;
    registerHandler?: (handler: null | ((command: string) => void)) => void;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
};
interface CommunicationFormInState extends CommunicationForm {
    handleClose?: (data?: Record<string, any>) => void;
    originalData: string;
    changed: boolean;
}
interface InputAction extends ActionBase {
    /** If it is a device action */
    deviceId?: string;
    /** Optional refresh function to execute */
    refresh?: () => void;
}
export type CommunicationState = {
    showSpinner: boolean;
    showToast: string | null;
    message: {
        message: string;
        handleClose: () => void;
    } | null;
    confirm: {
        message: string;
        handleClose: (confirmation?: boolean) => void;
    } | null;
    form: CommunicationFormInState | null;
    progress: ProgressUpdate | null;
    showConfirmation: InputAction | null;
    showInput: InputAction | null;
    inputValue: string | boolean | number | null;
    selectedInstance: string;
};
/**
 * Communication Component
 */
export default class Communication<P extends CommunicationProps, S extends CommunicationState> extends Component<P, S> {
    private protocol;
    private responseTimeout;
    instanceHandler: (action: ActionBase) => () => void;
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;
    controlHandler: (deviceId: string, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;
    controlStateHandler: (deviceId: string, control: ControlBase) => () => Promise<ioBroker.State | null>;
    constructor(props: P);
    componentWillUnmount(): void;
    loadData(): void;
    updateDevice(_update: DeviceInfo): void;
    deleteDevice(_deviceId: DeviceId): void;
    sendActionToInstance: (command: CommandName, messageToSend: Message, refresh?: () => void) => void;
    sendControlToInstance: (command: CommandName, messageToSend: {
        deviceId: string;
        controlId: string;
        state?: ControlState;
    }) => Promise<null | ioBroker.State>;
    loadDevices(callback: LoadDevicesCallback): Promise<void>;
    loadInstanceInfos(): Promise<InstanceDetails>;
    renderMessageDialog(): React.JSX.Element | null;
    renderConfirmDialog(): React.JSX.Element | null;
    renderSnackbar(): React.JSX.Element;
    getOkButton(button?: ActionButton | 'apply' | 'cancel' | 'close'): React.JSX.Element;
    getCancelButton(button?: ActionButton | 'apply' | 'cancel' | 'close'): React.JSX.Element;
    renderFormDialog(): React.JSX.Element | null;
    renderProgressDialog(): React.JSX.Element | null;
    renderContent(): React.JSX.Element | React.JSX.Element[] | null;
    renderSpinner(): React.JSX.Element | null;
    renderConfirmationDialog(): React.JSX.Element | null;
    onShowInputOk(): void;
    renderInputDialog(): React.JSX.Element | null;
    render(): React.JSX.Element;
}
export {};
