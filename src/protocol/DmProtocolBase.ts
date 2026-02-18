import { type Connection } from '@iobroker/adapter-react-v5';
import type { ErrorResponse, RetVal } from '@iobroker/dm-utils';
import type {
    ActionButton,
    ControlState,
    JsonFormSchema,
    DeviceInfo,
    InstanceDetails,
    DeviceRefreshResponse,
    InstanceRefreshResponse,
} from './api';

export interface Message {
    actionId?: string;
    deviceId?: string;
    value?: unknown;
    origin?: string;
    confirm?: boolean;
    data?: any;
    /** Inform backend, how long the frontend will wait for an answer */
    timeout?: number;
}

export interface CommunicationForm {
    title?: ioBroker.StringOrTranslated | null | undefined;
    label?: ioBroker.StringOrTranslated | null | undefined; // same as title
    noTranslation?: boolean; // Do not translate title/label
    schema: JsonFormSchema;
    data?: Record<string, any>;
    buttons?: (ActionButton | 'apply' | 'cancel' | 'close')[];
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Minimal width of the dialog */
    minWidth?: number;
    /** Always allow the apply button. Even when nothing was changed */
    ignoreApplyDisabled?: boolean;
}

export interface DmResponse {
    /* Type of message */
    type: 'message' | 'confirm' | 'progress' | 'result' | 'form';
    /* Origin */
    origin: string;
}

export interface DmControlResponse extends DmResponse {
    result: {
        error?: {
            code: number;
            message: string;
        };
        state?: ioBroker.State;
        deviceId: string;
        controlId: string;
    };
}

export interface DmActionResponse extends DmResponse {
    result: ErrorResponse | DeviceRefreshResponse | InstanceRefreshResponse;
    message?: string;
    confirm?: string;
    form?: CommunicationForm;
    progress?:
        | {
              open: boolean;
              indeterminate: boolean;
          }
        | {
              open: boolean;
              progress: number;
          };
}

export type CommandName = `dm:${string}`;

export type LoadDevicesCallback = (batch: DeviceInfo[], total?: number) => RetVal<void>;

export abstract class DmProtocolBase {
    constructor(
        private readonly selectedInstance: string,
        private readonly socket: Connection,
    ) {}

    public abstract convertInstanceDetails(details: any): InstanceDetails;

    public abstract loadDevices(callback: LoadDevicesCallback): Promise<void>;

    public abstract sendAction(command: CommandName, messageToSend: Message): Promise<DmActionResponse>;

    public abstract sendControl(
        command: CommandName,
        messageToSend: { deviceId: string; controlId: string; state?: ControlState },
    ): Promise<DmControlResponse>;

    protected send<T = any>(command: CommandName, data?: any): Promise<T> {
        return this.socket.sendTo(this.selectedInstance, command, data);
    }
}
