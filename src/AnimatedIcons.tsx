/**
 * Own animated icons of the device manager, in the style of the animated icons of `@iobroker/gui-components`:
 * plain CSS/SVG, `currentColor`, the size of the MUI icons and less motion if the user asked for it.
 */
import React, { useEffect, useRef, type CSSProperties } from 'react';

import { useDmStyles } from './styles';

interface OwnIconProps {
    className?: string;
    style?: CSSProperties;
    /** Accessible name. Without it, the icon is decorative. */
    ariaLabel?: string;
}

function svgProps(props: OwnIconProps, className: string): React.SVGProps<SVGSVGElement> {
    return {
        viewBox: '0 0 24 24',
        width: '1em',
        height: '1em',
        className: `${className}${props.className ? ` ${props.className}` : ''}`,
        style: { fontSize: '1.5rem', flexShrink: 0, ...props.style },
        role: props.ariaLabel ? 'img' : undefined,
        'aria-label': props.ariaLabel,
        'aria-hidden': props.ariaLabel ? undefined : true,
    };
}

/** True if the user asked the system for less motion */
function prefersReducedMotion(): boolean {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Color of the charge of a battery with this level */
export function batteryColor(level: number): string {
    if (level > 55) {
        return 'var(--dm-ok, #00ac00)';
    }
    if (level > 25) {
        return '#e6b800';
    }
    if (level > 10) {
        return 'var(--dm-warn, #da8200)';
    }
    return 'var(--dm-err, #ff0000)';
}

export interface IconBatteryProps extends OwnIconProps {
    /** Charge in percent. Without it the battery is shown without a level (e.g. for a voltage). */
    level?: number;
    /** The battery is charging: the charge fills up again and again */
    charging?: boolean;
}

/** Battery whose charge slides to the new level when it changes */
export function IconBattery(props: IconBatteryProps): React.JSX.Element {
    useDmStyles();
    const known = typeof props.level === 'number' && !props.charging;
    const level = known ? Math.max(0, Math.min(100, props.level!)) : 100;
    // An empty battery still shows a sliver, so that its color is visible
    const scale = known ? Math.max(0.08, level / 100) : 1;
    let className = 'dm-bat';
    if (props.charging) {
        className += ' dm-bat-charging';
    } else if (!known) {
        className += ' dm-bat-unknown';
    }
    const svg = svgProps(props, className);
    return (
        <svg
            {...svg}
            style={{ ...svg.style, '--dm-bat': known ? batteryColor(level) : undefined } as CSSProperties}
        >
            <rect
                className="dm-bat-body"
                x="2.8"
                y="6.8"
                width="16.4"
                height="10.4"
                rx="2.2"
            />
            <rect
                className="dm-bat-cap"
                x="19.9"
                y="9.9"
                width="2"
                height="4.2"
                rx="0.8"
            />
            <rect
                className="dm-bat-fill"
                x="4.6"
                y="8.6"
                width="12.8"
                height="6.8"
                rx="0.9"
                style={{ transform: `scaleX(${scale})` }}
            />
            {props.charging ? (
                <path
                    className="dm-bat-bolt"
                    d="M11.9 7.4 8.4 12.6h2.9l-.6 4 3.6-5.3h-2.9z"
                />
            ) : null}
        </svg>
    );
}

/** Number of the lit bars for a signal strength in dBm */
function signalBars(rssi: number): number {
    if (rssi >= -55) {
        return 4;
    }
    if (rssi >= -67) {
        return 3;
    }
    if (rssi >= -80) {
        return 2;
    }
    return 1;
}

export interface IconSignalProps extends OwnIconProps {
    /** Signal strength (RSSI) in dBm */
    rssi: number;
}

/** Four bars for the signal strength. When it changes, the bars light up or go out one after another. */
export function IconSignal(props: IconSignalProps): React.JSX.Element {
    useDmStyles();
    const bars = signalBars(props.rssi);
    return (
        <svg {...svgProps(props, 'dm-sig')}>
            {[0, 1, 2, 3].map(i => (
                <rect
                    key={i}
                    className={i < bars ? 'dm-sig-on' : undefined}
                    x={3 + i * 5}
                    y={16 - i * 4}
                    width="3.2"
                    height={4 + i * 4}
                    rx="1"
                />
            ))}
        </svg>
    );
}

/** An update can be installed: the arrow drops into the tray while the mouse is over the icon or its button */
export function IconUpdate(props: OwnIconProps): React.JSX.Element {
    useDmStyles();
    return (
        <svg {...svgProps(props, 'dm-upd')}>
            <path d="M4 14.5v3.2A2.3 2.3 0 0 0 6.3 20h11.4a2.3 2.3 0 0 0 2.3-2.3v-3.2" />
            <path
                className="dm-upd-arrow"
                d="M12 3.5v10.5M7.6 9.8 12 14.2l4.4-4.4"
            />
        </svg>
    );
}

/**
 * Lets the new value of a status slide in when it changes (not on the first render).
 *
 * @param value the shown value
 * @returns the ref for the element that shows the value
 */
export function useValueTick<T extends HTMLElement>(value: unknown): React.RefObject<T | null> {
    const ref = useRef<T>(null);
    const previous = useRef(value);
    useEffect(() => {
        if (Object.is(previous.current, value)) {
            return;
        }
        const goesUp = typeof value === 'number' && typeof previous.current === 'number' && value > previous.current;
        previous.current = value;
        if (!ref.current?.animate || prefersReducedMotion()) {
            return;
        }
        ref.current.animate(
            [
                { transform: `translateY(${goesUp ? 45 : -45}%)`, opacity: 0 },
                { transform: 'none', opacity: 1 },
            ],
            { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        );
    }, [value]);
    return ref;
}
