import React, { Component } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import {
    Breadcrumbs,
    Link,
    Toolbar,
    AppBar,
    IconButton,
    Stack,
    Slider,
    Snackbar,
    Menu,
    MenuItem,
    Box,
    LinearProgress,
} from '@mui/material';

import DeviceList from '../../src/DeviceList';

import {
    ImageNotSupported,
    KeyboardReturn,
    Photo,
    AddPhotoAlternate,
    ContentCopy,
    Refresh,
    ArrowCircleLeft,
    Close as IconClose,
} from '@mui/icons-material';

import {
    Loader,
    I18n,
    Utils,
    Error as DialogError,
    Theme,
    Connection,
    PROGRESS,
    type IobTheme,
    type ThemeType,
    type ThemeName,
} from '@iobroker/adapter-react-v5';

import '@iobroker/adapter-react-v5/build/index.css';
import logo from './assets/echarts.svg';

import enGlobLang from '@iobroker/adapter-react-v5/i18n/en.json';
import deGlobLang from '@iobroker/adapter-react-v5/i18n/de.json';
import ruGlobLang from '@iobroker/adapter-react-v5/i18n/ru.json';
import ptGlobLang from '@iobroker/adapter-react-v5/i18n/pt.json';
import nlGlobLang from '@iobroker/adapter-react-v5/i18n/nl.json';
import frGlobLang from '@iobroker/adapter-react-v5/i18n/fr.json';
import itGlobLang from '@iobroker/adapter-react-v5/i18n/it.json';
import esGlobLang from '@iobroker/adapter-react-v5/i18n/es.json';
import plGlobLang from '@iobroker/adapter-react-v5/i18n/pl.json';
import ukGlobLang from '@iobroker/adapter-react-v5/i18n/uk.json';
import zhGlobLang from '@iobroker/adapter-react-v5/i18n/zh-cn.json';

const styles: Record<string, any> = {
    root: {
        // border:     '0 solid #FFF',
        display: 'block',
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        // background: 'white',
        color: 'black',
        borderRadius: 4,
        boxShadow:
            '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        border: '0px solid #888',
    },
};

interface AppState {
    connected: boolean;
    theme: IobTheme;
    themeType: ThemeType;
    themeName: ThemeName;
    toast: string;
    errorText: string | null;
}

class App extends Component<object, AppState> {
    private adminCorrectTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly socket: Connection;

    private isMounted_ = false;

    constructor(props: any) {
        super(props);

        const themeInstance = App.createTheme();

        const queryHash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
        const location = queryHash.split('/');
        if (!location.length) {
            location.push('');
        }

        this.state = {
            connected: false,
            theme: themeInstance,
            themeType: App.getThemeType(themeInstance),
            themeName: App.getThemeName(themeInstance),
            toast: '',
            errorText: null,
        };

        // init translations
        const translations: Record<ioBroker.Languages, Record<string, string>> = {
            en: enGlobLang,
            de: deGlobLang,
            ru: ruGlobLang,
            pt: ptGlobLang,
            nl: nlGlobLang,
            fr: frGlobLang,
            it: itGlobLang,
            es: esGlobLang,
            pl: plGlobLang,
            uk: ukGlobLang,
            'zh-cn': zhGlobLang,
        };

        I18n.setTranslations(translations);

        if (window.socketUrl && window.socketUrl.startsWith(':')) {
            window.socketUrl = `${window.location.protocol}//${window.location.hostname}${window.socketUrl}`;
        }

        // some people use invalid URL to access charts
        if (window.location.port === '8082' && window.location.pathname.includes('/adapter/echarts/preview/')) {
            this.adminCorrectTimeout = setTimeout(() => {
                this.adminCorrectTimeout = null;
                // The address is wrong. Navigate to /echarts/index.html
                window.location.href = window.location.href.replace('/adapter/echarts/preview/', '/echarts/preview/');
            }, 2000);
        }

        this.socket = new Connection({
            name: window.adapterName,
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({ connected: false });
                } else {
                    this.setState({ connected: true });
                }
            },
            onReady: async () => {
                if (this.adminCorrectTimeout) {
                    clearTimeout(this.adminCorrectTimeout);
                    this.adminCorrectTimeout = null;
                }

                I18n.setLanguage(this.socket.systemLang);
            },
            onError: err => {
                console.error(err);
                this.showError(err);
            },
        });
    }

    /**
     * Get a theme
     *
     * @param name Theme name
     */
    static createTheme(name?: ThemeName): IobTheme {
        return Theme(Utils.getThemeName(name));
    }

    /**
     * Get the theme name
     *
     * @param theme Theme
     */
    static getThemeName(theme: IobTheme): ThemeName {
        return theme.name;
    }

    /**
     * Get the theme type
     *
     * @param theme Theme
     */
    static getThemeType(theme: IobTheme): ThemeType {
        return theme.palette.mode;
    }

    toggleTheme(): void {
        const themeName = this.state.themeName;

        // dark => blue => colored => light => dark
        const newThemeName = themeName === 'dark' ? 'light' : 'dark';

        Utils.setThemeName(newThemeName);

        const theme = Theme(newThemeName);

        this.setState({
            theme,
            themeName: theme.name,
            themeType: theme.palette.mode,
        });
    }

    showError(text: string): void {
        this.setState({ errorText: text });
    }

    renderError(): React.JSX.Element | null {
        if (!this.state.errorText) {
            return null;
        }
        return (
            <DialogError
                text={this.state.errorText}
                onClose={() => this.setState({ errorText: '' })}
            />
        );
    }

    /**
     * Renders the toast.
     */
    renderToast(): React.JSX.Element | null {
        if (!this.state.toast) {
            return null;
        }

        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={true}
                autoHideDuration={6000}
                onClose={() => this.setState({ toast: '' })}
                ContentProps={{ 'aria-describedby': 'message-id' }}
                message={<span id="message-id">{this.state.toast}</span>}
                action={[
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        onClick={() => this.setState({ toast: '' })}
                        size="large"
                    >
                        <IconClose />
                    </IconButton>,
                ]}
            />
        );
    }

    render(): React.JSX.Element {
        if (!this.state.connected) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <div style={styles.root}>
                        <DeviceList
                            socket={this.socket}
                            themeType={this.state.themeType}
                            themeName={this.state.themeName}
                            theme={this.state.theme}
                            isFloatComma
                            dateFormat="YYYY-MM-DD"
                        />
                    </div>
                    {this.renderError()}
                    {this.renderToast()}
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default App;
