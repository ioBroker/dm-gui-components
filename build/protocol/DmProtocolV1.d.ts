import type { ControlState, DmActionResponse, DmControlResponse, InstanceDetails } from './api';
import { DmProtocolBase, type CommandName, type LoadDevicesCallback, type Message } from './DmProtocolBase';
export declare class DmProtocolV1 extends DmProtocolBase {
    convertInstanceDetails(details: any): InstanceDetails;
    loadDevices(callback: LoadDevicesCallback): Promise<void>;
    sendAction(command: CommandName, messageToSend: Message): Promise<DmActionResponse>;
    sendControl(command: CommandName, messageToSend: {
        deviceId: string;
        controlId: string;
        state?: ControlState;
    }): Promise<DmControlResponse>;
}
