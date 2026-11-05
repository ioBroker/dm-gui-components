import React, { Component } from 'react';
import { type IobTheme } from '@iobroker/gui-components';

interface SwitchProps {
    checked: boolean;
    style?: React.CSSProperties;
    onChange: (checked: boolean) => void;
    theme: IobTheme;
    labelOn?: string;
    labelOff?: string;
    size?: 'small';
    disabled?: boolean;
    /** Accessible name */
    ariaLabel?: string;
}

const WIDTH = 34;
const HANDLE_SIZE = 20;
const WIDTH_SMALL = 30;
const HANDLE_SIZE_SMALL = 15;

/** The handle overshoots a little, as if it snapped into place */
const SNAP = 'cubic-bezier(0.3, 1.5, 0.5, 1)';

export default class Switch extends Component<SwitchProps> {
    private toggle(e: React.SyntheticEvent): void {
        if (this.props.disabled) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        this.props.onChange(!this.props.checked);
    }

    render(): React.JSX.Element {
        const small = this.props.size === 'small';
        const width = small ? WIDTH_SMALL : WIDTH;
        const handle = small ? HANDLE_SIZE_SMALL : HANDLE_SIZE;
        const primary = this.props.theme.palette.primary.main;

        const sw = (
            <div
                role="switch"
                className="dm-switch"
                aria-checked={this.props.checked}
                aria-disabled={this.props.disabled || undefined}
                aria-label={this.props.ariaLabel}
                tabIndex={this.props.disabled ? -1 : 0}
                style={{
                    width,
                    height: HANDLE_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: this.props.disabled ? 'default' : 'pointer',
                    position: 'relative',
                    opacity: this.props.disabled ? 0.6 : 1,
                    borderRadius: HANDLE_SIZE / 2,
                    outlineOffset: 2,
                    ...this.props.style,
                }}
                onClick={e => this.toggle(e)}
                onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        this.toggle(e);
                    }
                }}
            >
                <div
                    style={{
                        borderRadius: 15,
                        width: '100%',
                        height: handle * 0.7,
                        opacity: this.props.checked ? 0.5 : 0.6,
                        backgroundColor: this.props.checked ? primary : this.props.theme.palette.text.disabled,
                        transition: 'background-color 0.25s, opacity 0.25s',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: small ? (HANDLE_SIZE - HANDLE_SIZE_SMALL) / 2 : 0,
                        left: 0,
                        transform: `translateX(${this.props.checked ? width - handle : 0}px)`,
                        transition: `transform 0.3s ${SNAP}, background-color 0.25s`,
                        borderRadius: '50%',
                        width: handle,
                        height: handle,
                        backgroundColor: this.props.checked ? primary : '#EEE',
                        boxShadow:
                            'rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px',
                    }}
                />
            </div>
        );

        if (this.props.labelOn || this.props.labelOff) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {this.props.labelOff}
                    {sw}
                    {this.props.labelOn}
                </div>
            );
        }

        return sw;
    }
}
