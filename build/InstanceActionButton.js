import React from 'react';
import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';
export default function InstanceActionButton(params) {
    const { action, instanceHandler } = params;
    const tooltip = getTranslation(action?.description ? action.description : '');
    const title = getTranslation(action?.title || '');
    // If the action is rendered as a text button and no icon was explicitly requested,
    // do not fall back to the "question mark" icon
    const icon = renderActionIcon(action, !!title && !action.icon);
    return (React.createElement(TooltipButton, { style: action.style, variant: action.variant, tooltip: tooltip, label: title, disabled: action.disabled, Icon: icon, onClick: instanceHandler(action), url: 'url' in action ? getTranslation(action.url) : undefined }));
}
//# sourceMappingURL=InstanceActionButton.js.map