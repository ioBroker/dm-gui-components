import React from 'react';
import type { ActionBase, ControlBase } from './protocol/api';
export declare function renderControlIcon(action: ControlBase, colors?: {
    primary: string;
    secondary: string;
}, value?: string | number | boolean | null, noDefaultIcon?: boolean): React.JSX.Element | null;
export declare function renderActionIcon(action: ActionBase): React.JSX.Element | null;
/**
 * Get Translation
 */
export declare function getTranslation(
/** Text to translate */
text: ioBroker.StringOrTranslated, noTranslation?: boolean): string;
