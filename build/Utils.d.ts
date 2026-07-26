import React from 'react';
import type { ActionBase, ControlBase, IndicatorColor } from './protocol/api';
import { type IobTheme } from '@iobroker/gui-components';
export declare function renderControlIcon(action: ControlBase, colors?: {
    primary: string;
    secondary: string;
}, value?: string | number | boolean | null, noDefaultIcon?: boolean): React.JSX.Element | null;
/**
 * Render an icon that is given as a plain name (and not as a part of an action or control)
 *
 * @param icon `fa-*` name, `data:image/...` string, URL or one of the names supported by `getIconByName`
 * @param color color of the icon
 * @param noDefaultIcon if true, no "question mark" icon will be returned for unknown or missing names
 */
export declare function renderIcon(icon?: string, color?: string, noDefaultIcon?: boolean): React.JSX.Element | null;
/**
 * Resolve the color of a status indicator.
 *
 * The semantic tokens use the same colors as the built-in status icons, but adapted to the theme,
 * so custom indicators do not look foreign next to connection, battery, warning and update.
 *
 * @param color semantic token, `primary`, `secondary` or an explicit CSS color
 * @param theme current theme
 */
export declare function getIndicatorColor(color: IndicatorColor | undefined, theme: IobTheme): string | undefined;
export declare function renderActionIcon(action: ActionBase, noDefaultIcon?: boolean): React.JSX.Element | null;
/**
 * Get Translation
 */
export declare function getTranslation(
/** Text to translate */
text: ioBroker.StringOrTranslated, noTranslation?: boolean): string;
