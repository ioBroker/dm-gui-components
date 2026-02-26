import { DmProtocolV1 } from './DmProtocolV1';
export class DmProtocolV2 extends DmProtocolV1 {
    convertInstanceDetails(details) {
        if (details.apiVersion !== 'v2') {
            throw new Error(`Unsupported API version: ${details.apiVersion ?? 'unknown'}`);
        }
        const v1 = details;
        return { ...v1, apiVersion: 'v3' };
    }
}
//# sourceMappingURL=DmProtocolV2.js.map