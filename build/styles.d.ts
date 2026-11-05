import type React from 'react';
import type { IobTheme } from '@iobroker/gui-components';
/** Puts the style sheet into the page once. Safe to call in a constructor, before the first paint. */
export declare function ensureDmStyles(): void;
/** The same for function components */
export declare function useDmStyles(): void;
/**
 * The colors of the theme as CSS variables for the classes above.
 *
 * Cached per theme: the object is handed to every card, and a stable reference keeps the style
 * comparison of React cheap.
 */
export declare function getThemeVars(theme: IobTheme): React.CSSProperties;
/** Tone of a status pill: the color it is tinted with */
export type PillTone = 'ok' | 'warn' | 'err' | 'info';
/** Style that sets the tone of a pill */
export declare function toneStyle(tone?: PillTone): React.CSSProperties | undefined;
