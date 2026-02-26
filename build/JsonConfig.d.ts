import React from 'react';
import type { Connection, ThemeName, ThemeType, IobTheme } from '@iobroker/adapter-react-v5';
import { type ConfigItemPanel, type ConfigItemTabs } from '@iobroker/json-config';
interface JsonConfigDmProps {
    instanceId: string;
    socket: Connection;
    schema: ConfigItemPanel | ConfigItemTabs;
    data: Record<string, any>;
    onChange: (data: Record<string, any>) => void;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma?: boolean;
    dateFormat?: string;
    expertMode?: boolean;
}
export default function JsonConfig(props: JsonConfigDmProps): React.JSX.Element | null;
export {};
