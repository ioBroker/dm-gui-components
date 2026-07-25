import React from 'react';

import type { ActionBase, InstanceAction } from './protocol/api';

import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';

interface InstanceActionButtonProps {
    action: InstanceAction;
    instanceHandler: (action: ActionBase) => () => void;
}

export default function InstanceActionButton(params: InstanceActionButtonProps): React.JSX.Element | null {
    const { action, instanceHandler } = params;

    const tooltip = getTranslation(action?.description ? action.description : '');
    const title = getTranslation(action?.title || '');

    // If the action is rendered as a text button and no icon was explicitly requested,
    // do not fall back to the "question mark" icon
    const icon = renderActionIcon(action, !!title && !action.icon);

    return (
        <TooltipButton
            style={action.style}
            variant={action.variant}
            tooltip={tooltip}
            label={title}
            disabled={action.disabled}
            Icon={icon}
            onClick={instanceHandler(action)}
            url={'url' in action ? getTranslation(action.url) : undefined}
        />
    );
}
