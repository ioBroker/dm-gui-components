import type { Connection } from '@iobroker/adapter-react-v5';
import type { ValueOrStateOrObject } from '@iobroker/dm-utils';
import { useEffect, useState } from 'react';
import { StateOrObjectHandler } from './StateOrObjectHandler';

export function useStateOrObject<T extends ioBroker.StringOrTranslated | number | boolean>(
    item: ValueOrStateOrObject<T> | undefined,
    socket: Connection,
): T | undefined {
    const [value, setValue] = useState<T>();

    useEffect(() => {
        const handler = new StateOrObjectHandler(socket);
        void handler.addListener(item, value => setValue(value));
        return () => void handler.unsubscribe();
    }, [socket, item]);

    return value;
}
