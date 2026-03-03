import { useEffect, useState } from 'react';
export function useStateOrObject(item, stateOrObjectHandler) {
    const [value, setValue] = useState();
    useEffect(() => {
        let subscription = undefined;
        void stateOrObjectHandler.addListener(item, value => setValue(value)).then(sub => (subscription = sub));
        return () => void subscription?.unsubscribe();
    }, [stateOrObjectHandler, item]);
    return value;
}
//# sourceMappingURL=hooks.js.map