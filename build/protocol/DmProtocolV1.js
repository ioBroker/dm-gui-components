import { DmProtocolBase } from './DmProtocolBase';
export class DmProtocolV1 extends DmProtocolBase {
    convertInstanceDetails(details) {
        if (details.apiVersion !== 'v1') {
            throw new Error(`Unsupported API version: ${details.apiVersion ?? 'unknown'}`);
        }
        const v1 = details;
        return { ...v1, apiVersion: 'v3' };
    }
    async loadDevices(callback) {
        // in V1, devices come in a single batch; thus we can simply call the callback with those
        const devices = await this.send('dm:listDevices');
        await callback(devices.map(d => ({ ...d, identifier: d.id })));
    }
    sendAction(command, messageToSend) {
        return this.send(command, messageToSend);
    }
    sendControl(command, messageToSend) {
        return this.send(command, messageToSend);
    }
}
//# sourceMappingURL=DmProtocolV1.js.map