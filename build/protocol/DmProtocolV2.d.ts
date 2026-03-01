import type { InstanceDetails } from './api';
import { DmProtocolV1 } from './DmProtocolV1';
export declare class DmProtocolV2 extends DmProtocolV1 {
    convertInstanceDetails(details: any): InstanceDetails;
}
