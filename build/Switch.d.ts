import React, { Component } from 'react';
import { type IobTheme } from '@iobroker/adapter-react-v5';
interface SwitchProps {
    checked: boolean;
    style?: React.CSSProperties;
    onChange: (checked: boolean) => void;
    theme: IobTheme;
    labelOn?: string;
    labelOff?: string;
    size?: 'small';
    disabled?: boolean;
}
export default class Switch extends Component<SwitchProps> {
    render(): React.JSX.Element;
}
export {};
