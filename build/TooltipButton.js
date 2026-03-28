import React from 'react';
import { Button, IconButton, Tooltip, Typography } from '@mui/material';
export default function TooltipButton(props) {
    const { tooltip, label, disabled, Icon, onClick, url } = props;
    const text = label ? (React.createElement(Typography, { variant: "button", sx: props.style, style: { marginLeft: 4 } }, label)) : null;
    const btnProps = url ? { href: url, disabled, target: '_blank' } : { onClick, disabled };
    if (tooltip) {
        return (React.createElement(Tooltip, { title: tooltip, slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
            React.createElement("span", null, text ? (React.createElement(Button, { ...btnProps, sx: props.style, variant: props.variant, startIcon: Icon }, text)) : (React.createElement(IconButton, { ...btnProps, sx: props.style, size: "small" }, Icon)))));
    }
    return text ? (React.createElement(Button, { ...btnProps, sx: props.style, variant: props.variant, startIcon: Icon }, text)) : (React.createElement(IconButton, { ...btnProps, sx: props.style, size: "small" }, Icon));
}
//# sourceMappingURL=TooltipButton.js.map