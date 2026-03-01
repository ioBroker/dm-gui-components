import React from 'react';
import type { ActionBase, InstanceAction } from './protocol/api';
interface InstanceActionButtonProps {
    action: InstanceAction;
    instanceHandler: (action: ActionBase) => () => void;
}
export default function InstanceActionButton(params: InstanceActionButtonProps): React.JSX.Element | null;
export {};
