import React from 'react';
import { ButtonBase, Tooltip } from '@mui/material';

import { toneStyle, useDmStyles, type PillTone } from './styles';

interface StatusPillProps {
    /** Tints the pill with this color: the value needs attention. Without it the pill is neutral. */
    tone?: PillTone;
    tooltip?: React.ReactNode;
    /** The pill becomes a button */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Opens the URL instead */
    href?: string;
    disabled?: boolean;
    /** Text color (e.g. the color of a custom indicator), if the pill has no tone */
    color?: string;
    children: React.ReactNode;
}

const tooltipSlotProps = { popper: { sx: { pointerEvents: 'none' } } };

/** One value of the status line: an icon and an optional short text */
export default function StatusPill(props: StatusPillProps): React.JSX.Element {
    useDmStyles();
    const className = `dm-pill${props.tone ? ' dm-pill-tone' : ''}`;
    const style = props.tone ? toneStyle(props.tone) : props.color ? { color: props.color } : undefined;

    let pill: React.JSX.Element;
    if (props.href) {
        pill = (
            <ButtonBase
                component="a"
                className={`${className} dm-pill-btn`}
                style={style}
                disabled={props.disabled}
                href={props.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {props.children}
            </ButtonBase>
        );
    } else if (props.onClick) {
        pill = (
            <ButtonBase
                className={`${className} dm-pill-btn`}
                style={style}
                disabled={props.disabled}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    // The card around may react to clicks too
                    e.stopPropagation();
                    props.onClick!(e);
                }}
            >
                {props.children}
            </ButtonBase>
        );
    } else {
        pill = (
            <span
                className={className}
                style={style}
            >
                {props.children}
            </span>
        );
    }

    if (!props.tooltip) {
        return pill;
    }

    return (
        <Tooltip
            title={props.tooltip}
            slotProps={tooltipSlotProps}
        >
            {/* A disabled button gets no mouse events, so the tooltip needs an element around it */}
            <span className="dm-pill-wrap">{pill}</span>
        </Tooltip>
    );
}
