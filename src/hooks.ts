import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
import { useEffect, useState } from 'react';
import type { StateOrObjectHandler } from './StateOrObjectHandler';

export function useStateOrObject<T extends ioBroker.StringOrTranslated | number | boolean>(
    item: ValueOrStateOrObject<T> | undefined,
    stateOrObjectHandler: StateOrObjectHandler,
): T | undefined {
    const [value, setValue] = useState<T>();

    useEffect(() => {
        void stateOrObjectHandler.addListener(item, value => setValue(value));
        return () => void stateOrObjectHandler.unsubscribe();
    }, [stateOrObjectHandler, item]);

    return value;
}
