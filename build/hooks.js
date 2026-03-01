import { useEffect, useState } from 'react';
import { StateOrObjectHandler } from './StateOrObjectHandler';
export function useStateOrObject(item, socket) {
    const [value, setValue] = useState();
    useEffect(() => {
        const handler = new StateOrObjectHandler(socket);
        void handler.addListener(item, value => setValue(value));
        return () => void handler.unsubscribe();
    }, [socket, item]);
    return value;
}
//# sourceMappingURL=hooks.js.map