import { DmProtocolBase } from './DmProtocolBase';
export class UnknownDmProtocol extends DmProtocolBase {
    constructor() {
        // as socket is never used in this protocol, we can use this ugly hack:
        super('', undefined);
    }
    convertInstanceDetails(details) {
        return details;
    }
    loadDevices(_callback) {
        throw new Error('Protocol version unknown');
    }
    sendAction(_command, _messageToSend) {
        throw new Error('Protocol version unknown');
    }
    sendControl(_command, _messageToSend) {
        throw new Error('Protocol version unknown');
    }
}
//# sourceMappingURL=UnknownDmProtocol.js.map