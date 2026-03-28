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

    const icon = renderActionIcon(action);

    return (
        <TooltipButton
            style={action.style}
            variant={action.variant}
            tooltip={tooltip}
            label={title}
            disabled={action.disabled}
            Icon={icon}
            onClick={instanceHandler(action)}
        />
    );
}
