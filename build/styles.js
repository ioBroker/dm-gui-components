import { useInsertionEffect } from 'react';
import { getIndicatorColor } from './Utils';
/**
 * One style sheet for the cards, the status pills and the own animations.
 *
 * The list renders a few hundred cards. Plain classes are much cheaper than an `sx` property per element,
 * and the theme reaches the classes through CSS variables (see `getThemeVars`).
 */
const STYLE_ID = 'iob-dm-styles';
const styles = `
/* ---------- Card ---------- */
.dm-card { box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid var(--dm-border); background-color: var(--dm-paper); background-image: var(--dm-overlay); color: var(--dm-text); font-size: 13px; line-height: 1.4; }
.dm-head { display: flex; align-items: center; gap: 12px; box-sizing: border-box; min-height: 72px; padding: 14px 6px 10px 14px; }
.dm-small .dm-head { gap: 10px; min-height: 56px; padding: 10px 2px 8px 10px; }
.dm-name { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; transition: color 0.3s; }
.dm-small .dm-name { font-size: 13.5px; }
.dm-head-end { align-self: flex-start; display: flex; align-items: center; margin-top: -4px; }
.dm-small .dm-head-end { margin-top: -6px; }

/* The device symbol: the place for the color of the device and for its LED */
.dm-avatar { position: relative; flex-shrink: 0; box-sizing: border-box; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--dm-accent); color: var(--dm-accent-text); transition: filter 0.4s, opacity 0.4s; }
.dm-small .dm-avatar { width: 34px; height: 34px; border-radius: 8px; }
.dm-avatar-img { background: var(--dm-tile); padding: 4px; }
.dm-avatar-glyph { width: 26px; height: 26px; }
.dm-small .dm-avatar-glyph { width: 20px; height: 20px; }
.dm-avatar-img .dm-avatar-glyph { width: 100%; height: 100%; object-fit: contain; }
.dm-avatar-letter { font-size: 20px; font-weight: 600; line-height: 1; text-transform: uppercase; }
.dm-small .dm-avatar-letter { font-size: 16px; }
.dm-avatar-led { position: absolute; right: -6px; bottom: -6px; display: flex; line-height: 0; font-size: 18px; border-radius: 50%; background-color: var(--dm-paper); background-image: var(--dm-overlay); }
.dm-small .dm-avatar-led { right: -5px; bottom: -5px; font-size: 15px; }
.dm-off .dm-avatar { filter: grayscale(1); opacity: 0.45; }
.dm-off .dm-name { color: var(--dm-text2); }

/* Image upload on the device symbol */
.dm-upload { position: absolute; inset: 0; border-radius: inherit; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.55); color: #fff; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.dm-avatar:hover .dm-upload, .dm-upload:focus-within, .dm-upload.dm-upload-busy { opacity: 1; }
.dm-upload input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.dm-small .dm-upload .iob-ani { font-size: 18px; }

/* Status line */
.dm-status { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; min-height: 34px; padding: 0 12px 8px; color: var(--dm-text2); }
.dm-small .dm-status { gap: 2px 3px; min-height: 30px; padding: 0 8px 6px; }
.dm-status-end { margin-left: auto; display: flex; align-items: center; padding-left: 4px; }

/* A status value. Neutral while all is well; tinted with its color when it needs attention. */
.dm-pill.dm-pill { display: inline-flex; align-items: center; gap: 4px; box-sizing: border-box; height: 26px; padding: 0 6px; border: 0; border-radius: 7px; background-color: transparent; color: inherit; font-family: inherit; font-size: 12px; font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; text-decoration: none; }
.dm-small .dm-pill.dm-pill { padding: 0 4px; gap: 3px; }
.dm-pill > svg, .dm-pill > .iob-ani, .dm-pill .MuiSvgIcon-root { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
.dm-pill > img { width: 18px; height: 18px; }
.dm-pill-tone.dm-pill-tone { color: var(--dm-tone); background-color: color-mix(in srgb, var(--dm-tone) 15%, transparent); }
.dm-pill-btn.dm-pill-btn { cursor: pointer; transition: background-color 0.15s; }
.dm-pill-btn.dm-pill-btn:hover { background-color: var(--dm-hover); }
.dm-pill-tone.dm-pill-btn:hover { background-color: color-mix(in srgb, var(--dm-tone) 26%, transparent); }
.dm-pill-btn:focus-visible { outline: 2px solid var(--dm-focus); outline-offset: 1px; }
.dm-pill-btn.Mui-disabled { opacity: 0.6; }
.dm-pill-wrap { display: inline-flex; }

/* Facts: label and value */
.dm-facts { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: 12px; row-gap: 2px; padding: 4px 14px 12px; }
.dm-small .dm-facts { column-gap: 8px; padding: 2px 10px 10px; font-size: 12px; }
.dm-fact-label { color: var(--dm-text2); font-size: 12px; white-space: nowrap; }
.dm-small .dm-fact-label { font-size: 11.5px; }
.dm-fact-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dm-fact-copy { display: flex; align-items: center; min-width: 0; gap: 2px; }
.dm-fact-copy > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dm-copy-btn.dm-copy-btn { padding: 3px; margin: -4px 0; color: var(--dm-text2); opacity: 0.6; transition: opacity 0.15s; }
.dm-fact-copy:hover .dm-copy-btn, .dm-copy-btn:focus-visible { opacity: 1; }
.dm-copy-btn .iob-ani { font-size: 16px; }
.dm-custom { padding: 0 14px 12px; }
.dm-small .dm-custom { padding: 0 10px 10px; }

/* Actions */
.dm-foot { margin-top: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; box-sizing: border-box; min-height: 44px; padding: 4px 8px; border-top: 1px solid var(--dm-border); }
.dm-small .dm-foot { gap: 0; min-height: 38px; padding: 2px 4px; }
.dm-small .dm-foot .MuiIconButton-sizeSmall { padding: 4px; }
.dm-small .dm-foot .MuiIconButton-sizeSmall > :is(svg, .iob-ani) { font-size: 20px; }
/* !important: the control sets its size inline */
.dm-small .dm-foot-end .MuiFab-root.MuiFab-root { width: 30px !important; height: 30px !important; min-height: 30px !important; }
.dm-foot-end { margin-left: auto; display: flex; align-items: center; gap: 4px; }
/* A control in the footer is a quiet round button; only a switched on control gets its color */
.dm-foot-end .MuiFab-root.MuiFab-root { width: 34px; height: 34px; min-height: 34px; box-shadow: none; }
.dm-foot-end .MuiFab-default.MuiFab-default { background-color: var(--dm-tile); color: var(--dm-text); }
.dm-foot-end .MuiFab-default.MuiFab-default:hover { background-color: var(--dm-hover); }

/* Skeleton: the same footprint as the card */
.dm-skeleton .dm-avatar { background: var(--dm-tile); }

/* Instance cards on the root page */
.dm-inst.dm-inst { width: 240px; margin: 10px; }
.dm-inst-small.dm-inst-small { width: 200px; margin: 5px; }
.dm-inst-area.dm-inst-area { display: flex; flex-direction: column; align-items: center; gap: 10px; height: 100%; padding: 20px 16px 18px; text-align: center; color: inherit; font-family: inherit; }
.dm-inst-small .dm-inst-area.dm-inst-area { flex-direction: row; justify-content: flex-start; gap: 10px; padding: 10px; text-align: left; }
.dm-inst .dm-avatar { width: 64px; height: 64px; border-radius: 14px; background: var(--dm-tile); padding: 8px; }
.dm-inst-small .dm-avatar { width: 38px; height: 38px; border-radius: 9px; padding: 5px; }
.dm-inst-id { font-size: 16px; font-weight: 600; overflow-wrap: anywhere; }
.dm-inst-small .dm-inst-id { font-size: 13.5px; }
.dm-inst-title { color: var(--dm-text2); font-size: 13px; }
.dm-inst-small .dm-inst-title { font-size: 12px; }
.dm-inst-small .dm-inst-text { min-width: 0; }
.dm-inst-small .dm-inst-text > div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Empty list: what happened and what to do */
.dm-empty { box-sizing: border-box; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 56px 16px; color: var(--dm-text2); font-size: 14px; text-align: center; }
.dm-empty > .iob-ani, .dm-empty > svg { font-size: 48px; }

/* Confirmation after a successful action */
.dm-result { position: fixed; left: 50%; top: 50%; z-index: 1500; display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; margin: -42px 0 0 -42px; border-radius: 50%; background-color: var(--dm-paper); background-image: var(--dm-overlay); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); pointer-events: none; animation: dm-result 1.25s ease forwards; }
.dm-result .iob-ani { font-size: 52px; }
.dm-toast { display: flex; align-items: center; gap: 10px; }
.dm-toast .iob-ani { font-size: 22px; }

/* ---------- Own animations ---------- */

/* Action symbols show what the button does while the mouse is over it */
.dm-ani.dm-ani { transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.dm-ani-gear.dm-ani-gear { transition-duration: 0.6s; }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-spin { transform: rotate(180deg); }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-gear { transform: rotate(90deg); }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-turn { transform: rotate(90deg); }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-launch { transform: translate(1.5px, -1.5px); }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-nudge { transform: translateX(2px); }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-pen { animation: dm-pen 0.5s ease-in-out; }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-hop { animation: dm-hop 0.5s ease-out; }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-search { animation: dm-search 0.7s ease-in-out; }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-glow { animation: dm-glow 0.6s ease-in-out; }
:is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani-tick { animation: dm-tick 0.4s ease-out; }
@keyframes dm-pen { 0%, 100% { transform: none; } 30% { transform: rotate(-14deg) translateY(-1px); } 65% { transform: rotate(8deg); } }
@keyframes dm-hop { 0%, 100% { transform: none; } 40% { transform: translateY(-3px); } 70% { transform: translateY(0.5px); } }
@keyframes dm-search { 0%, 100% { transform: none; } 25% { transform: translate(-1.5px, -1px); } 50% { transform: translate(1px, -1.5px); } 75% { transform: translate(1px, 1px); } }
@keyframes dm-glow { 0%, 100% { filter: none; } 50% { filter: drop-shadow(0 0 3px currentColor); } }
@keyframes dm-tick { 0%, 100% { transform: none; } 50% { transform: scale(1.15); } }

/* Battery: the charge slides to its level */
.dm-bat .dm-bat-body { fill: none; stroke: currentColor; stroke-width: 1.6; }
.dm-bat .dm-bat-cap { fill: currentColor; }
.dm-bat .dm-bat-fill { fill: var(--dm-bat, currentColor); transform-box: fill-box; transform-origin: 0 50%; transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), fill 0.4s; }
.dm-bat-unknown .dm-bat-fill { opacity: 0.35; }
.dm-bat-charging .dm-bat-fill { animation: dm-bat-charge 1.8s ease-in-out infinite; }
.dm-bat .dm-bat-bolt { fill: currentColor; stroke: var(--dm-paper, #fff); stroke-width: 0.9; stroke-linejoin: round; paint-order: stroke; }
@keyframes dm-bat-charge { 0% { transform: scaleX(0.15); } 80%, 100% { transform: scaleX(1); } }

/* Signal: the bars light up one after another */
.dm-sig rect { fill: currentColor; opacity: 0.22; transition: opacity 0.3s; }
.dm-sig rect.dm-sig-on { opacity: 1; }
.dm-sig rect:nth-child(2) { transition-delay: 0.07s; }
.dm-sig rect:nth-child(3) { transition-delay: 0.14s; }
.dm-sig rect:nth-child(4) { transition-delay: 0.21s; }

/* Update: the arrow drops into the tray */
.dm-upd path { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.dm-upd .dm-upd-arrow { transition: transform 0.25s ease-out; }
.dm-upd:hover .dm-upd-arrow, :is(button, a, [role="button"]):is(:hover, :focus-visible) .dm-upd .dm-upd-arrow { transform: translateY(2.5px); }

@keyframes dm-result { 0% { opacity: 0; transform: scale(0.7); } 12% { opacity: 1; transform: scale(1); } 78% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.92); } }
@keyframes dm-fade { 0%, 100% { opacity: 0; } 15%, 80% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
    .dm-ani.dm-ani, .dm-bat .dm-bat-fill, .dm-sig rect, .dm-upd .dm-upd-arrow, .dm-avatar, .dm-upload, .dm-name, .dm-switch, .dm-switch * { transition: none !important; }
    :is(button, a, [role="button"], [role="menuitem"]):is(:hover, :focus-visible) .dm-ani { transform: none !important; animation: none !important; }
    .dm-bat-charging .dm-bat-fill { animation: none; }
    .dm-upd:hover .dm-upd-arrow, :is(button, a, [role="button"]):is(:hover, :focus-visible) .dm-upd .dm-upd-arrow { transform: none; }
    .dm-result { animation-name: dm-fade; }
}
`;
let inserted = false;
/** Puts the style sheet into the page once. Safe to call in a constructor, before the first paint. */
export function ensureDmStyles() {
    if (inserted || typeof window === 'undefined') {
        return;
    }
    inserted = true;
    let style = window.document.getElementById(STYLE_ID);
    if (!style) {
        style = window.document.createElement('style');
        style.setAttribute('id', STYLE_ID);
        window.document.head.appendChild(style);
    }
    // Also replaces the sheet of an older copy of this module (e.g. after a hot reload)
    style.innerHTML = styles;
}
/** The same for function components */
export function useDmStyles() {
    useInsertionEffect(ensureDmStyles, []);
}
const themeVarsCache = new WeakMap();
/**
 * The colors of the theme as CSS variables for the classes above.
 *
 * Cached per theme: the object is handed to every card, and a stable reference keeps the style
 * comparison of React cheap.
 */
export function getThemeVars(theme) {
    let vars = themeVarsCache.get(theme);
    if (!vars) {
        const dark = theme.palette.mode === 'dark';
        vars = {
            '--dm-paper': theme.palette.background.paper,
            // Like the elevation of the MUI paper: in the dark themes paper and page have the same color
            '--dm-overlay': dark ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' : 'none',
            // Not `palette.divider`: in some themes it has nearly the color of the card and the lines disappear
            '--dm-border': dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
            '--dm-text': theme.palette.text.primary,
            '--dm-text2': theme.palette.text.secondary,
            '--dm-hover': theme.palette.action.hover,
            '--dm-tile': dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            '--dm-focus': theme.palette.primary.main,
            '--dm-ok': getIndicatorColor('ok', theme),
            '--dm-warn': getIndicatorColor('warning', theme),
            '--dm-err': getIndicatorColor('error', theme),
            '--dm-info': getIndicatorColor('info', theme),
        };
        themeVarsCache.set(theme, vars);
    }
    return vars;
}
const toneStyles = {
    ok: { '--dm-tone': 'var(--dm-ok)' },
    warn: { '--dm-tone': 'var(--dm-warn)' },
    err: { '--dm-tone': 'var(--dm-err)' },
    info: { '--dm-tone': 'var(--dm-info)' },
};
/** Style that sets the tone of a pill */
export function toneStyle(tone) {
    return tone ? toneStyles[tone] : undefined;
}
//# sourceMappingURL=styles.js.map