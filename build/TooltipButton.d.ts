import React from 'react';
interface TooltipButtonProps {
    tooltip?: string;
    label?: string;
    disabled?: boolean;
    Icon: React.JSX.Element | null;
    onClick?: () => void;
    url?: string;
    variant?: 'text' | 'outlined' | 'contained';
    /** `inherit` takes the text color of the parent, e.g. on a colored toolbar. Default is the primary color */
    color?: 'inherit' | 'primary';
    style?: Record<string, any>;
}
export default function TooltipButton(props: TooltipButtonProps): React.JSX.Element;
export {};
