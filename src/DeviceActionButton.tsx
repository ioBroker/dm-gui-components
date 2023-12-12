import React from 'react';

import TooltipButton from './TooltipButton.js';
import { renderIcon, getTranslation } from './Utils.js';
import {ActionBase} from "@iobroker/dm-utils/build/types/base";

interface DeviceActionButtonProps {
    deviceId: string;
    action: any;
    refresh: () => void;
    deviceHandler: (deviceId: string, action: ActionBase<'api'>, refresh: () => void) => () => void;
}

export default function DeviceActionButton(props: DeviceActionButtonProps): React.JSX.Element {
    const {
        deviceId, action, refresh, deviceHandler,
    } = props;

    const tooltip = getTranslation(action.description);

    const icon = renderIcon(action);

    return <TooltipButton
        label={action.label || (icon ? null : action.id)}
        tooltip={tooltip}
        disabled={action.disabled}
        Icon={icon}
        onClick={deviceHandler(deviceId, action, refresh)}
    />;
}
