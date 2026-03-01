import React from 'react';
import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';
export default function InstanceActionButton(params) {
    const { action, instanceHandler } = params;
    const tooltip = getTranslation(action?.description ? action.description : '');
    const title = getTranslation(action?.title ? action.title : '');
    const icon = renderActionIcon(action);
    return (React.createElement(TooltipButton, { tooltip: tooltip, label: title, disabled: action.disabled, Icon: icon, onClick: instanceHandler(action) }));
}
//# sourceMappingURL=InstanceActionButton.js.map