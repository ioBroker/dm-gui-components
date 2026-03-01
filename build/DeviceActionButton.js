import React from 'react';
import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';
export default function DeviceActionButton(props) {
    const { deviceId, action, refresh, deviceHandler, disabled } = props;
    const icon = renderActionIcon(action);
    const tooltip = getTranslation(action.description ?? '') || (icon ? null : action.id);
    return (React.createElement(TooltipButton, { tooltip: tooltip || undefined, disabled: disabled || action.disabled, Icon: icon, onClick: deviceHandler(deviceId, action, refresh), url: 'url' in action ? getTranslation(action.url) : undefined }));
}
//# sourceMappingURL=DeviceActionButton.js.map