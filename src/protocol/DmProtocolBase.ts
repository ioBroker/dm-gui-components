import { type Connection } from '@iobroker/gui-components';
import type { DeviceId, RetVal } from '@iobroker/dm-utils';
import type { ControlState, DeviceInfo, DmActionResponse, DmControlResponse, InstanceDetails } from './api';

export interface Message {
    actionId?: string;
    deviceId?: DeviceId;
    value?: unknown;
    origin?: number;
    confirm?: boolean;
    data?: any;
    /** Inform backend, how long the frontend will wait for an answer */
    timeout?: number;
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

    public abstract sendAction(
        command: CommandName,
        messageToSend: Message,
    ): Promise<DmActionResponse | DmControlResponse>;

    public abstract sendControl(
        command: CommandName,
        messageToSend: { deviceId: DeviceId; controlId: string; state?: ControlState },
    ): Promise<DmControlResponse>;

    protected send<T = any>(command: CommandName, data?: any): Promise<T> {
        return this.socket.sendTo(this.selectedInstance, command, data);
    }
}
