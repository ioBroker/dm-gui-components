import type { ControlState, DmActionResponse, DmControlResponse, InstanceDetails } from './api';
import { type CommandName, DmProtocolBase, type LoadDevicesCallback, type Message } from './DmProtocolBase';
export declare class UnknownDmProtocol extends DmProtocolBase {
    constructor();
    convertInstanceDetails(details: any): InstanceDetails;
    loadDevices(_callback: LoadDevicesCallback): Promise<void>;
    sendAction(_command: CommandName, _messageToSend: Message): Promise<DmActionResponse>;
    sendControl(_command: CommandName, _messageToSend: {
        deviceId: string;
        controlId: string;
        state?: ControlState;
    }): Promise<DmControlResponse>;
}
