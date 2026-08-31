import React from 'react';
/**
 * One `IntersectionObserver` for all cards of a list.
 *
 * A device manager with 100 devices would otherwise create 100 observers. The root is the scrolling
 * container of the list; it is set as soon as the container is mounted, because the `rootMargin` of
 * an observer that watches the viewport would be cut off by the clip rectangle of that container -
 * the cards would then only be mounted once they are really visible, and the user would see them
 * pop in.
 */
export class LazyRenderObserver {
    observer = null;
    root = null;
    callbacks = new Map();
    rootMargin;
    /** Browsers without `IntersectionObserver` simply render everything */
    supported = typeof IntersectionObserver !== 'undefined';
    /**
     * @param rootMargin how far outside the visible area a card is already rendered
     */
    constructor(rootMargin = '900px 0px') {
        this.rootMargin = rootMargin;
    }
    /** Set the scrolling container. Re-creates the observer and re-observes all known elements */
    setRoot(root) {
        if (!this.supported || root === this.root) {
            return;
        }
        this.root = root;
        this.observer?.disconnect();
        this.observer = null;
        if (this.callbacks.size) {
            const observer = this.getObserver();
            for (const element of this.callbacks.keys()) {
                observer.observe(element);
            }
        }
    }
    observe(element, callback) {
        if (!this.supported) {
            callback(true);
            return;
        }
        this.callbacks.set(element, callback);
        this.getObserver().observe(element);
    }
    unobserve(element) {
        this.callbacks.delete(element);
        this.observer?.unobserve(element);
    }
    destroy() {
        this.observer?.disconnect();
        this.observer = null;
        this.callbacks.clear();
    }
    getObserver() {
        this.observer ||= new IntersectionObserver(this.handleEntries, {
            root: this.root,
            rootMargin: this.rootMargin,
        });
        return this.observer;
    }
    handleEntries = (entries) => {
        for (const entry of entries) {
            this.callbacks.get(entry.target)?.(entry.isIntersecting);
        }
    };
}
/**
 * Renders its content only while it is inside or near the visible area of the list.
 *
 * The placeholder always occupies the full footprint of a card, so the layout of the wrapping
 * flex container and the length of the scrollbar stay exactly the same as with all cards rendered.
 */
export class LazyRender extends React.Component {
    ref = React.createRef();
    /**
     * Height of the content the last time it was rendered. A card can be higher than `minHeight`
     * (custom info, several status lines), and without this the list below would jump as soon as
     * such a card is unmounted while scrolling.
     */
    lastHeight = 0;
    /**
     * Synchronous mirror of `state.visible`. Two observer callbacks can arrive before `setState` is
     * committed, and the second one must not be swallowed by a comparison against a stale state.
     */
    visible;
    constructor(props) {
        super(props);
        this.visible = !props.observer.supported;
        this.state = { visible: this.visible };
    }
    componentDidMount() {
        if (this.ref.current) {
            this.props.observer.observe(this.ref.current, this.onVisibilityChanged);
        }
    }
    componentWillUnmount() {
        if (this.ref.current) {
            this.props.observer.unobserve(this.ref.current);
        }
    }
    onVisibilityChanged = (visible) => {
        if (visible === this.visible) {
            return;
        }
        if (!visible) {
            this.lastHeight = this.ref.current?.getBoundingClientRect().height || this.lastHeight;
        }
        this.visible = visible;
        this.setState({ visible });
    };
    render() {
        return (React.createElement("div", { ref: this.ref, style: {
                width: this.props.width,
                // While the content is rendered, `minHeight` is the floor of a card. While it is
                // not, the height of its last rendering is kept as well, so that the cards below
                // do not jump when a higher card is dropped during scrolling.
                minHeight: this.state.visible
                    ? this.props.minHeight
                    : Math.max(this.props.minHeight, this.lastHeight),
                margin: this.props.margin,
                display: 'flex',
                flexShrink: 0,
            } }, this.state.visible ? this.props.children() : null));
    }
}
//# sourceMappingURL=LazyRender.js.map