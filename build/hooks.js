import { useEffect, useState } from 'react';
export function useStateOrObject(item, stateOrObjectHandler) {
    const [value, setValue] = useState();
    useEffect(() => {
        void stateOrObjectHandler.addListener(item, value => setValue(value));
        return () => void stateOrObjectHandler.unsubscribe();
    }, [stateOrObjectHandler, item]);
    return value;
}
//# sourceMappingURL=hooks.js.map