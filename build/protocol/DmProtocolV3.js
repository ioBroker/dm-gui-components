import { DmProtocolBase } from './DmProtocolBase';
export class DmProtocolV3 extends DmProtocolBase {
    convertInstanceDetails(details) {
        if (details.apiVersion !== 'v3') {
            throw new Error(`Unsupported API version: ${details.apiVersion ?? 'unknown'}`);
        }
        return details;
    }
    async loadDevices(callback) {
        let response = await this.send('dm:loadDevices');
        let total = response.total;
        while (response.add) {
            await callback(response.add, total);
            if (!response.next) {
                break;
            }
            response = await this.send('dm:deviceLoadProgress', response.next);
            total = response.total ?? total;
        }
    }
    sendAction(command, messageToSend) {
        return this.send(command, messageToSend);
    }
    sendControl(command, messageToSend) {
        return this.send(command, messageToSend);
    }
}
//# sourceMappingURL=DmProtocolV3.js.map