import React from 'react';
import { ButtonBase, Tooltip } from '@mui/material';
import { toneStyle, useDmStyles } from './styles';
const tooltipSlotProps = { popper: { sx: { pointerEvents: 'none' } } };
/** One value of the status line: an icon and an optional short text */
export default function StatusPill(props) {
    useDmStyles();
    const className = `dm-pill${props.tone ? ' dm-pill-tone' : ''}`;
    const style = props.tone ? toneStyle(props.tone) : props.color ? { color: props.color } : undefined;
    let pill;
    if (props.href) {
        pill = (React.createElement(ButtonBase, { component: "a", className: `${className} dm-pill-btn`, style: style, disabled: props.disabled, href: props.href, target: "_blank", rel: "noreferrer", onClick: (e) => e.stopPropagation() }, props.children));
    }
    else if (props.onClick) {
        pill = (React.createElement(ButtonBase, { className: `${className} dm-pill-btn`, style: style, disabled: props.disabled, onClick: (e) => {
                // The card around may react to clicks too
                e.stopPropagation();
                props.onClick(e);
            } }, props.children));
    }
    else {
        pill = (React.createElement("span", { className: className, style: style }, props.children));
    }
    if (!props.tooltip) {
        return pill;
    }
    return (React.createElement(Tooltip, { title: props.tooltip, slotProps: tooltipSlotProps },
        React.createElement("span", { className: "dm-pill-wrap" }, pill)));
}
//# sourceMappingURL=StatusPill.js.map