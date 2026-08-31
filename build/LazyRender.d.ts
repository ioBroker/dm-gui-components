import React, { type JSX } from 'react';
type VisibilityCallback = (visible: boolean) => void;
/**
 * One `IntersectionObserver` for all cards of a list.
 *
 * A device manager with 100 devices would otherwise create 100 observers. The root is the scrolling
 * container of the list; it is set as soon as the container is mounted, because the `rootMargin` of
 * an observer that watches the viewport would be cut off by the clip rectangle of that container -
 * the cards would then only be mounted once they are really visible, and the user would see them
 * pop in.
 */
export declare class LazyRenderObserver {
    private observer;
    private root;
    private readonly callbacks;
    private readonly rootMargin;
    /** Browsers without `IntersectionObserver` simply render everything */
    readonly supported: boolean;
    /**
     * @param rootMargin how far outside the visible area a card is already rendered
     */
    constructor(rootMargin?: string);
    /** Set the scrolling container. Re-creates the observer and re-observes all known elements */
    setRoot(root: Element | null): void;
    observe(element: Element, callback: VisibilityCallback): void;
    unobserve(element: Element): void;
    destroy(): void;
    private getObserver;
    private handleEntries;
}
interface LazyRenderProps {
    observer: LazyRenderObserver;
    /** Width of the placeholder while the content is not rendered */
    width: number;
    /** Height of the placeholder while the content was never rendered yet */
    minHeight: number;
    margin: number;
    /** Only called while the placeholder is inside (or near) the visible area of the list */
    children: () => JSX.Element;
}
interface LazyRenderState {
    visible: boolean;
}
/**
 * Renders its content only while it is inside or near the visible area of the list.
 *
 * The placeholder always occupies the full footprint of a card, so the layout of the wrapping
 * flex container and the length of the scrollbar stay exactly the same as with all cards rendered.
 */
export declare class LazyRender extends React.Component<LazyRenderProps, LazyRenderState> {
    private readonly ref;
    /**
     * Height of the content the last time it was rendered. A card can be higher than `minHeight`
     * (custom info, several status lines), and without this the list below would jump as soon as
     * such a card is unmounted while scrolling.
     */
    private lastHeight;
    /**
     * Synchronous mirror of `state.visible`. Two observer callbacks can arrive before `setState` is
     * committed, and the second one must not be swallowed by a comparison against a stale state.
     */
    private visible;
    constructor(props: LazyRenderProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    private onVisibilityChanged;
    render(): JSX.Element;
}
export {};
