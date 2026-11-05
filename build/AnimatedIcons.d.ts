/**
 * Own animated icons of the device manager, in the style of the animated icons of `@iobroker/gui-components`:
 * plain CSS/SVG, `currentColor`, the size of the MUI icons and less motion if the user asked for it.
 */
import React, { type CSSProperties } from 'react';
interface OwnIconProps {
    className?: string;
    style?: CSSProperties;
    /** Accessible name. Without it, the icon is decorative. */
    ariaLabel?: string;
}
/** Color of the charge of a battery with this level */
export declare function batteryColor(level: number): string;
export interface IconBatteryProps extends OwnIconProps {
    /** Charge in percent. Without it the battery is shown without a level (e.g. for a voltage). */
    level?: number;
    /** The battery is charging: the charge fills up again and again */
    charging?: boolean;
}
/** Battery whose charge slides to the new level when it changes */
export declare function IconBattery(props: IconBatteryProps): React.JSX.Element;
export interface IconSignalProps extends OwnIconProps {
    /** Signal strength (RSSI) in dBm */
    rssi: number;
}
/** Four bars for the signal strength. When it changes, the bars light up or go out one after another. */
export declare function IconSignal(props: IconSignalProps): React.JSX.Element;
/** An update can be installed: the arrow drops into the tray while the mouse is over the icon or its button */
export declare function IconUpdate(props: OwnIconProps): React.JSX.Element;
/**
 * Lets the new value of a status slide in when it changes (not on the first render).
 *
 * @param value the shown value
 * @returns the ref for the element that shows the value
 */
export declare function useValueTick<T extends HTMLElement>(value: unknown): React.RefObject<T | null>;
export {};
