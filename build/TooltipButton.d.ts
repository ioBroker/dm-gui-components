import React from 'react';
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
export default function TooltipButton(props: TooltipButtonProps): React.JSX.Element;
export {};
