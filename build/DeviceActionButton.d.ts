import React from 'react';
import type { ActionBase, DeviceAction, DeviceId } from './protocol/api';
interface DeviceActionButtonProps {
    deviceId: DeviceId;
    action: DeviceAction;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    disabled?: boolean;
}
export default function DeviceActionButton(props: DeviceActionButtonProps): React.JSX.Element;
export {};
