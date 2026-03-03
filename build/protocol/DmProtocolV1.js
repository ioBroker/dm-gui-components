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
    async sendAction(command, messageToSend) {
        const response = await this.send(command, messageToSend);
        switch (response.type) {
            case 'message':
                return {
                    type: 'message',
                    message: response.message || '',
                    origin: response.origin, // origin was accidentally set to string in V1
                };
            case 'confirm':
                return {
                    type: 'confirm',
                    confirm: response.confirm || '',
                    origin: response.origin, // origin was accidentally set to string in V1
                };
            case 'progress':
                return {
                    type: 'progress',
                    progress: response.progress || { open: false, indeterminate: true },
                    origin: response.origin, // origin was accidentally set to string in V1
                };
            case 'form':
                return {
                    type: 'form',
                    form: response.form || { title: '', schema: { type: 'panel', items: {} } },
                    origin: response.origin, // origin was accidentally set to string in V1
                };
            case 'result':
                if (response.result.error) {
                    return {
                        type: 'result',
                        result: { error: response.result.error },
                        origin: response.origin, // origin was accidentally set to string in V1
                    };
                }
                switch (response.result.refresh) {
                    case true:
                        return {
                            type: 'result',
                            result: { refresh: true },
                            origin: response.origin, // origin was accidentally set to string in V1
                        };
                    case 'device':
                        return {
                            type: 'result',
                            result: { refresh: 'devices' },
                            origin: response.origin, // origin was accidentally set to string in V1
                        };
                    case 'instance':
                        return {
                            type: 'result',
                            result: { refresh: 'instance' },
                            origin: response.origin, // origin was accidentally set to string in V1
                        };
                    default:
                        return {
                            type: 'result',
                            result: { refresh: false },
                            origin: response.origin, // origin was accidentally set to string in V1
                        };
                }
            default:
                throw new Error(`Unknown response type: ${response.type}`);
        }
    }
    async sendControl(command, messageToSend) {
        const response = await this.send(command, messageToSend);
        // contents matches, types unfortunately don't, so we need to cast here
        return response;
    }
}
//# sourceMappingURL=DmProtocolV1.js.map