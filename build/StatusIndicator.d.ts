import React from 'react';
import type { IobTheme } from '@iobroker/gui-components';
import type { StatusIndicator as StatusIndicatorConfig } from './protocol/api';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
interface StatusIndicatorProps {
    indicator: StatusIndicatorConfig;
    theme: IobTheme;
    stateOrObjectHandler: StateOrObjectHandler;
    /** Called when the indicator is clicked. If not provided, the indicator is not clickable */
    onClick?: () => void;
    /** If the referenced action opens a URL instead of calling the backend */
    url?: string;
    disabled?: boolean;
    /** Color used if the indicator does not define one itself (e.g. white in the toolbar) */
    defaultColor?: string;
}
/**
 * A single custom status indicator.
 *
 * Every visual property may be bound to a state or an object, so the indicator follows its value
 * live. The optional `levels` list maps value ranges to icon, color and text.
 */
export default function StatusIndicator(props: StatusIndicatorProps): React.JSX.Element | null;
interface StatusIndicatorsProps {
    indicators?: StatusIndicatorConfig[];
    theme: IobTheme;
    stateOrObjectHandler: StateOrObjectHandler;
    /**
     * Resolves the click handler for an indicator that references an action. Returns `undefined`
     * if the referenced action does not exist - the indicator stays a pure display element then.
     */
    resolveAction?: (actionId: string) => {
        onClick?: () => void;
        url?: string;
        disabled?: boolean;
    } | undefined;
    disabled?: boolean;
    defaultColor?: string;
    style?: React.CSSProperties;
    /** Additional elements rendered in the same line (e.g. actions with `placement: 'status'`) */
    children?: React.ReactNode;
}
/**
 * The line of custom status indicators.
 *
 * The line wraps if it does not fit, so an arbitrary number of indicators can be shown without
 * cutting anything off.
 */
export declare function StatusIndicators(props: StatusIndicatorsProps): React.JSX.Element | null;
export {};
