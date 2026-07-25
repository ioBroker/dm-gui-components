import React from 'react';
import type { ActionBase, DeviceAction, DeviceId } from './protocol/api';
import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';

interface DeviceActionButtonProps {
    deviceId: DeviceId;
    action: DeviceAction;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    disabled?: boolean;
}

export default function DeviceActionButton(props: DeviceActionButtonProps): React.JSX.Element {
    const { deviceId, action, deviceHandler, disabled } = props;

    // "title" and "variant" allow rendering an action as a text button instead of an icon button
    const { title, variant } = action;

    const label = title ? getTranslation(title) : '';

    // If the action is rendered as a text button and no icon was explicitly requested,
    // do not fall back to the "question mark" icon
    const icon = renderActionIcon(action, !!label && !action.icon);

    const tooltip = getTranslation(action.description ?? '') || (icon || label ? null : action.id);

    return (
        <TooltipButton
            tooltip={tooltip || undefined}
            label={label || undefined}
            variant={variant}
            style={action.style}
            disabled={disabled || action.disabled}
            Icon={icon}
            onClick={deviceHandler(deviceId, action)}
            url={'url' in action ? getTranslation(action.url) : undefined}
        />
    );
}
