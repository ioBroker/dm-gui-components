/* eslint-disable class-methods-use-this */
import type * as V1 from '@iobroker/dm-utils-v1/build/types/api';
import type { ControlState, DeviceInfo, InstanceDetails } from './api';
import {
    type CommandName,
    type DmActionResponse,
    type DmControlResponse,
    DmProtocolBase,
    type LoadDevicesCallback,
    type Message,
} from './DmProtocolBase';

export class DmProtocolV1 extends DmProtocolBase {
    public override convertInstanceDetails(details: any): InstanceDetails {
        if (details.apiVersion !== 'V1') {
            throw new Error(`Unsupported API version: ${details.apiVersion ?? 'unknown'}`);
        }

        const v1 = details as V1.InstanceDetails;
        return { ...v1, apiVersion: 'v2' };
    }

    public override async loadDevices(callback: LoadDevicesCallback): Promise<void> {
        // in V1, devices come in a single batch, thus we can simply call the callback with those
        const devices = await this.send<V1.DeviceInfo[]>('dm:listDevices');
        await callback(devices.map<DeviceInfo>(d => ({ ...d, identifier: d.id })));
    }

    public override sendAction(command: CommandName, messageToSend: Message): Promise<DmActionResponse> {
        return this.send<DmActionResponse>(command, messageToSend);
    }

    public sendControl(
        command: CommandName,
        messageToSend: { deviceId: string; controlId: string; state?: ControlState },
    ): Promise<DmControlResponse> {
        return this.send<DmControlResponse>(command, messageToSend);
    }
}
