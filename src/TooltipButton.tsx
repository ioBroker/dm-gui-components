import React from 'react';
import { Button, IconButton, Tooltip, Typography } from '@mui/material';

interface TooltipButtonProps {
    tooltip?: string;
    label?: string;
    disabled?: boolean;
    Icon: React.JSX.Element | null;
    onClick?: () => void;
    url?: string;
    variant?: 'text' | 'outlined' | 'contained';
    style?: Record<string, any>;
}

export default function TooltipButton(props: TooltipButtonProps): React.JSX.Element {
    const { tooltip, label, disabled, Icon, onClick, url } = props;

    const text = label ? (
        <Typography
            variant="button"
            sx={props.style}
            style={{ marginLeft: 4 }}
        >
            {label}
        </Typography>
    ) : null;

    const btnProps = url ? { href: url, disabled, target: '_blank' } : { onClick, disabled };

    if (tooltip) {
        return (
            <Tooltip
                title={tooltip}
                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
            >
                <span>
                    {text ? (
                        <Button
                            {...btnProps}
                            sx={props.style}
                            variant={props.variant}
                            startIcon={Icon}
                        >
                            {text}
                        </Button>
                    ) : (
                        <IconButton
                            {...btnProps}
                            sx={props.style}
                            size="small"
                        >
                            {Icon}
                        </IconButton>
                    )}
                </span>
            </Tooltip>
        );
    }

    return text ? (
        <Button
            {...btnProps}
            sx={props.style}
            variant={props.variant}
            startIcon={Icon}
        >
            {text}
        </Button>
    ) : (
        <IconButton
            {...btnProps}
            sx={props.style}
            size="small"
        >
            {Icon}
        </IconButton>
    );
}
