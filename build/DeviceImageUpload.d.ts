import React from 'react';
import type { Connection } from '@iobroker/adapter-react-v5';
import type { DeviceId } from './protocol/api';
interface DeviceImageUploadProps {
    socket: Connection;
    manufacturer?: string;
    model?: string;
    deviceId: DeviceId;
    onImageSelect: (image: string) => void;
    uploadImagesToInstance: string;
}
declare function DeviceImageUpload(params: DeviceImageUploadProps): React.JSX.Element | null;
export default DeviceImageUpload;
