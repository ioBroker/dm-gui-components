import React from 'react';
import { type PillTone } from './styles';
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
/** One value of the status line: an icon and an optional short text */
export default function StatusPill(props: StatusPillProps): React.JSX.Element;
export {};
