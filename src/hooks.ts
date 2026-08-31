import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
import { useEffect, useState } from 'react';
import type { StateOrObjectHandler, StateOrObjectSubscription } from './StateOrObjectHandler';

export function useStateOrObject<T extends ioBroker.StringOrTranslated | number | boolean>(
    item: ValueOrStateOrObject<T> | undefined,
    stateOrObjectHandler: StateOrObjectHandler,
): T | undefined {
    const [value, setValue] = useState<T>();

    useEffect(() => {
        // `addListener` is asynchronous. If the effect is cleaned up before it settles, `subscription`
        // is still undefined and the plain `subscription?.unsubscribe()` of a naive cleanup would leak
        // the socket subscription and keep calling `setValue` on an unmounted component. The flag makes
        // both cases safe: the value is dropped and the late subscription is unsubscribed at once.
        let cancelled = false;
        let subscription: StateOrObjectSubscription | undefined;

        void stateOrObjectHandler
            .addListener(item, newValue => {
                if (!cancelled) {
                    setValue(newValue);
                }
            })
            .then(sub => {
                subscription = sub;
                if (cancelled) {
                    void sub.unsubscribe();
                }
            });

        return () => {
            cancelled = true;
            void subscription?.unsubscribe();
        };
    }, [stateOrObjectHandler, item]);

    return value;
}
