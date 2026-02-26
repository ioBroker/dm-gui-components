import { type Connection } from '@iobroker/adapter-react-v5';
import type { RetVal } from '@iobroker/dm-utils';
import type { ControlState, DeviceInfo, DmActionResponse, DmControlResponse, InstanceDetails } from './api';
export interface Message {
    actionId?: string;
    deviceId?: string;
    value?: unknown;
    origin?: number;
    confirm?: boolean;
    data?: any;
    /** Inform backend, how long the frontend will wait for an answer */
    timeout?: number;
}
export type CommandName = `dm:${string}`;
export type LoadDevicesCallback = (batch: DeviceInfo[], total?: number) => RetVal<void>;
export declare abstract class DmProtocolBase {
    private readonly selectedInstance;
    private readonly socket;
    constructor(selectedInstance: string, socket: Connection);
    abstract convertInstanceDetails(details: any): InstanceDetails;
    abstract loadDevices(callback: LoadDevicesCallback): Promise<void>;
    abstract sendAction(command: CommandName, messageToSend: Message): Promise<DmActionResponse | DmControlResponse>;
    abstract sendControl(command: CommandName, messageToSend: {
        deviceId: string;
        controlId: string;
        state?: ControlState;
    }): Promise<DmControlResponse>;
    protected send<T = any>(command: CommandName, data?: any): Promise<T>;
}
