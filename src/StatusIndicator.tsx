import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

import type { IobTheme } from '@iobroker/gui-components';

import { useStateOrObject } from './hooks';
import type { StatusIndicator as StatusIndicatorConfig, StatusIndicatorLevel } from './protocol/api';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
import { getIndicatorColor, getTranslation, renderIcon } from './Utils';

const styles: Record<string, React.CSSProperties> = {
    tooltip: {
        pointerEvents: 'none',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1,
    },
    text: {
        fontSize: 'small',
        margin: 0,
        whiteSpace: 'nowrap',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
};

/**
 * Find the first matching level for the given value.
 *
 * A level matches if its `value` equals the current value, if the numeric value lies within
 * `min`/`max` (both inclusive) or if the level defines no condition at all (catch-all).
 */
function findLevel(
    levels: StatusIndicatorLevel[],
    value: string | number | boolean | undefined,
): StatusIndicatorLevel | undefined {
    for (const level of levels) {
        if (level.value !== undefined) {
            if (level.value === value) {
                return level;
            }
            continue;
        }
        if (level.min !== undefined || level.max !== undefined) {
            if (typeof value !== 'number') {
                continue;
            }
            if (level.min !== undefined && value < level.min) {
                continue;
            }
            if (level.max !== undefined && value > level.max) {
                continue;
            }
            return level;
        }
        // no condition => catch-all
        return level;
    }

    return undefined;
}

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
export default function StatusIndicator(props: StatusIndicatorProps): React.JSX.Element | null {
    const { indicator, stateOrObjectHandler } = props;

    const value = useStateOrObject<string | number | boolean>(indicator.value, stateOrObjectHandler);
    const icon = useStateOrObject<string>(indicator.icon, stateOrObjectHandler);
    const iconOn = useStateOrObject<string>(indicator.iconOn, stateOrObjectHandler);
    const color = useStateOrObject<string>(indicator.color, stateOrObjectHandler);
    const colorOn = useStateOrObject<string>(indicator.colorOn, stateOrObjectHandler);
    const text = useStateOrObject<ioBroker.StringOrTranslated>(indicator.text, stateOrObjectHandler);

    // An indicator without a value is a static icon and is always visible. With a value, it is hidden
    // while the value is "empty" - the numeric 0 counts as a value and stays visible.
    if (indicator.value !== undefined && indicator.hideIfEmpty !== false) {
        if (value === undefined || value === null || value === '' || value === false) {
            return null;
        }
    }

    const on = !!value;
    const level = indicator.levels ? findLevel(indicator.levels, value) : undefined;

    const iconName = level?.icon ?? (on ? (iconOn ?? icon) : icon);
    const colorName = level?.color ?? (on ? (colorOn ?? color) : color);
    const resolvedColor = getIndicatorColor(colorName, props.theme) || props.defaultColor;

    const levelText = level?.text ?? text;
    let label = levelText !== undefined ? getTranslation(levelText) : indicator.showValue ? String(value ?? '') : '';
    if (label && indicator.unit) {
        label += ` ${indicator.unit}`;
    }

    const tooltipSource = level?.tooltip ?? indicator.tooltip;
    const tooltip = tooltipSource ? getTranslation(tooltipSource) : '';

    // Only fall back to the "question mark" icon if the indicator shows nothing else at all
    const iconElement = iconName || !label ? renderIcon(iconName, resolvedColor) : null;

    const content = (
        <div style={styles.content}>
            {iconElement}
            {label ? <p style={{ ...styles.text, color: resolvedColor }}>{label}</p> : null}
        </div>
    );

    let element: React.JSX.Element;
    if (props.url) {
        element = (
            <IconButton
                size="small"
                style={{ padding: 2, borderRadius: 4 }}
                href={props.url}
                target="_blank"
                disabled={props.disabled}
            >
                {content}
            </IconButton>
        );
    } else if (props.onClick) {
        element = (
            <IconButton
                size="small"
                style={{ padding: 2, borderRadius: 4 }}
                disabled={props.disabled}
                onClick={e => {
                    // The card itself may react on clicks, so the event must not bubble
                    e.stopPropagation();
                    props.onClick?.();
                }}
            >
                {content}
            </IconButton>
        );
    } else {
        element = content;
    }

    if (!tooltip) {
        return element;
    }

    return (
        <Tooltip
            title={tooltip}
            slotProps={{ popper: { sx: styles.tooltip } }}
        >
            <span style={{ display: 'inline-flex' }}>{element}</span>
        </Tooltip>
    );
}

interface StatusIndicatorsProps {
    indicators?: StatusIndicatorConfig[];
    theme: IobTheme;
    stateOrObjectHandler: StateOrObjectHandler;
    /**
     * Resolves the click handler for an indicator that references an action. Returns `undefined`
     * if the referenced action does not exist - the indicator stays a pure display element then.
     */
    resolveAction?: (actionId: string) => { onClick?: () => void; url?: string; disabled?: boolean } | undefined;
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
export function StatusIndicators(props: StatusIndicatorsProps): React.JSX.Element | null {
    const indicators = props.indicators?.length
        ? [...props.indicators].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
        : [];

    if (!indicators.length && !props.children) {
        return null;
    }

    return (
        <div style={{ ...styles.row, ...props.style }}>
            {indicators.map(indicator => {
                const action = indicator.actionId ? props.resolveAction?.(indicator.actionId) : undefined;

                return (
                    <StatusIndicator
                        key={indicator.id}
                        indicator={indicator}
                        theme={props.theme}
                        stateOrObjectHandler={props.stateOrObjectHandler}
                        onClick={action?.onClick}
                        url={action?.url}
                        disabled={props.disabled || action?.disabled}
                        defaultColor={props.defaultColor}
                    />
                );
            })}
            {props.children}
        </div>
    );
}
