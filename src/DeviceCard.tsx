import React, { PureComponent, type JSX } from 'react';
import {
    Close as CloseIcon,
    VideogameAsset as ControlIcon,
    MoreVert as MoreVertIcon,
    ExpandMore,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    IconButton,
    Paper,
    Skeleton,
    Tooltip,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';

import {
    DeviceTypeIcon,
    Utils,
    type Connection,
    type IobTheme,
    type ThemeName,
    type ThemeType,
    Icon,
} from '@iobroker/gui-components';
import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceImageUpload from './DeviceImageUpload';
import DeviceStatusComponent from './DeviceStatus';
import JsonConfig from './JsonConfig';
import { StatusIndicators } from './StatusIndicator';
import type {
    ActionBase,
    ControlBase,
    ControlState,
    DeviceDetails,
    DeviceAction,
    DeviceControl,
    DeviceInfo,
    DeviceId,
} from './protocol/api';

import { getText, getTranslation } from './Utils';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
import type { ResolvedDeviceFields } from './DeviceFields';

// The type moved to `DeviceFields` together with the filtering itself. Re-exported here, because it
// used to be exported from this module.
export type { DeviceFilterField } from './DeviceFields';

/** Reserved action names (this is copied from https://github.com/ioBroker/dm-utils/blob/main/src/types/base.ts as we can only have type references to dm-utils) */
const ACTIONS = {
    /** This action will be called when the user clicks on the connection icon */
    STATUS: 'status',
    /** This action will be called when the user clicks on the enabled / disabled icon. The enabled/disabled icon will be shown only if the node status has the "enabled" flag set to false or true */
    ENABLE_DISABLE: 'enable/disable',
    /** This action will be called when the user clicks on the update indicator. The update indicator is shown only if `DeviceInfo.update.available` is true */
    UPDATE: 'update',
    /** This action will be called when the user clicks on the battery indicator. The battery indicator is shown only if the node status has the "battery" property */
    BATTERY: 'battery',
};

/**
 * Footprint of a card. The list needs it to give a not yet rendered card a placeholder of exactly
 * the same size, so that neither the layout nor the length of the scrollbar changes.
 */
export const CARD_WIDTH = 300;
export const CARD_MIN_HEIGHT = 280;
export const CARD_MARGIN = 10;

export const SMALL_CARD_WIDTH = 200;
export const SMALL_CARD_MIN_HEIGHT = 200;
export const SMALL_CARD_MARGIN = 5;

const cardSize: React.CSSProperties = { width: CARD_WIDTH, minHeight: CARD_MIN_HEIGHT, margin: CARD_MARGIN };
const smallCardSize: React.CSSProperties = {
    width: SMALL_CARD_WIDTH,
    minHeight: SMALL_CARD_MIN_HEIGHT,
    margin: SMALL_CARD_MARGIN,
};
/** A card that sits in a container which already has the footprint of a card */
const filledCardSize: React.CSSProperties = { width: '100%', margin: 0 };

/**
 * Icons read from the file storage of the adapter, keyed by `<instance>/<file>`.
 *
 * A card is unmounted and mounted again while scrolling, and without this cache every one of those
 * would repeat the `readFile` round trip for an icon that is very often not there at all.
 */
const fileIconCache = new Map<string, string>();

const styles: Record<string, any> = {
    cardStyle: (theme: IobTheme): React.CSSProperties => ({
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? '#0b0b0b' : '#d5d5d5',
    }),
    headerStyle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
        paddingRight: 8,
        position: 'relative',
        minHeight: 60,
        color: '#000',
    },
    imgAreaStyle: {
        height: 45,
        width: 45,
        justifyContent: 'center',
        display: 'flex',
        alignItems: 'center',
    },
    imgStyle: {
        zIndex: 2,
        maxWidth: '100%',
        maxHeight: '100%',
        color: '#FFF',
    },
    titleStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        // whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    detailsButtonStyle: {
        right: 20,
        bottom: -20,
        position: 'absolute',
    },
    bodyStyle: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    deviceInfoStyle: {
        padding: '20px 16px 0 16px',
    },
    statusStyle: {
        padding: '15px 25px 0 15px',
        // The line may grow if the device provides custom indicators, so only the minimum is fixed
        minHeight: 41,
    },
};

function NoImageIcon(props: { style?: React.CSSProperties; className?: string }): JSX.Element {
    return (
        <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            style={props.style}
            className={props.className}
        >
            <path
                fill="currentColor"
                d="M21.9,21.9l-8.49-8.49l0,0L3.59,3.59l0,0L2.1,2.1L0.69,3.51L3,5.83V19c0,1.1,0.9,2,2,2h13.17l2.31,2.31L21.9,21.9z M5,18 l3.5-4.5l2.5,3.01L12.17,15l3,3H5z M21,18.17L5.83,3H19c1.1,0,2,0.9,2,2V18.17z"
            />
        </svg>
    );
}

interface DeviceCardProps {
    /* Device ID */
    id: DeviceId;
    identifierLabel: ioBroker.StringOrTranslated;
    device: DeviceInfo;
    /**
     * The device fields resolved by the list. They may be bound to a state or an object, and the
     * list resolves them centrally: a card that is not rendered cannot resolve its own name, and
     * the filter of the list needs the values of all devices, not only of the rendered ones.
     */
    fields: ResolvedDeviceFields;
    /** Handler of the whole list, so that identical states/objects are only subscribed once */
    stateOrObjectHandler: StateOrObjectHandler;
    instanceId: string;
    socket: Connection;
    /* Instance, where the images should be uploaded to */
    uploadImagesToInstance?: string;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    controlHandler: (
        deviceId: DeviceId,
        control: ControlBase,
        state: ControlState,
    ) => () => Promise<ioBroker.State | null>;
    controlStateHandler: (deviceId: DeviceId, control: ControlBase) => () => Promise<ioBroker.State | null>;
    smallCards?: boolean;
    /** The card is rendered inside a container that already has the footprint of a card */
    fillContainer?: boolean;
    alive: boolean;
    themeName: ThemeName;
    themeType: ThemeType;
    theme: IobTheme;
    isFloatComma: boolean;
    dateFormat: string;
    /** IDs of configurable indicators the user has switched off */
    hiddenIndicators?: string[];
}

interface DeviceCardState {
    open: boolean;
    details: DeviceDetails | null;
    data: Record<string, any>;
    showControlDialog: boolean;
    /** Icon read from the file storage or picked by the user. Overrides `fields.icon` */
    localIcon?: string;
}

/**
 * Device Card Component.
 *
 * A `PureComponent`: the list re-renders on every loading step, on every filter change and on every
 * resolved device value. Without the shallow property comparison all cards would be re-rendered
 * every time, so all properties the list passes down are kept stable there.
 */
export default class DeviceCard extends PureComponent<DeviceCardProps, DeviceCardState> {
    /** True as long as the component is mounted; guards the asynchronous icon loading */
    private mounted = false;

    constructor(props: DeviceCardProps) {
        super(props);

        const cacheKey = DeviceCard.iconCacheKey(props);

        this.state = {
            open: false,
            details: null,
            data: {},
            showControlDialog: false,
            // Take a known icon over directly, so a card that is scrolled back into view does not flicker
            localIcon: cacheKey ? fileIconCache.get(cacheKey) : undefined,
        };
    }

    /**
     * Key of the icon in the file storage, or `null` if the device brings its own icon.
     *
     * The file is named after manufacturer and model, both of which may be bound to a state or an
     * object and therefore arrive only after the first render.
     */
    private static iconCacheKey(props: DeviceCardProps): string | null {
        if (props.device.icon) {
            return null;
        }
        const manufacturer = props.fields.manufacturer;
        const model = props.fields.model;
        const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || JSON.stringify(props.device.id)}`;
        return `${props.instanceId.replace('system.adapter.', '')}/${fileName}.webp`;
    }

    async fetchIcon(): Promise<void> {
        const cacheKey = DeviceCard.iconCacheKey(this.props);
        if (cacheKey) {
            const cached = fileIconCache.get(cacheKey);
            if (cached !== undefined) {
                if (this.state.localIcon !== cached) {
                    this.setState({ localIcon: cached });
                }
                return;
            }

            const [adapter, ...rest] = cacheKey.split('/');
            try {
                const file = await this.props.socket.readFile(adapter, rest.join('/'), true);
                const localIcon = file ? `data:${file.mimeType};base64,${file.file}` : '';
                fileIconCache.set(cacheKey, localIcon);
                if (!this.mounted) {
                    return;
                }
                this.setState({ localIcon });
                // const response = await fetch(url);
                // if (response.ok) {
                //     const blob = await response.blob();
                //     const reader = new FileReader();
                //     reader.onloadend = () => {
                //         setIcon(reader.result);
                //     };
                //     reader.readAsDataURL(blob);
                // } else {
                //     throw new Error('Response not ok');
                // }
            } catch {
                fileIconCache.set(cacheKey, '');
                if (this.mounted && this.state.localIcon) {
                    this.setState({ localIcon: '' });
                }
            }
        }
    }

    componentDidMount(): void {
        this.mounted = true;
        void this.fetchIcon().catch(e => console.error(e));
    }

    componentDidUpdate(prevProps: DeviceCardProps): void {
        // The icon is looked up in the file storage under `<manufacturer>_<model>`. Both may be bound
        // to a state or an object and therefore arrive only after the first render.
        if (
            prevProps.fields.manufacturer !== this.props.fields.manufacturer ||
            prevProps.fields.model !== this.props.fields.model ||
            prevProps.device.icon !== this.props.device.icon
        ) {
            void this.fetchIcon().catch(e => console.error(e));
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    /**
     * Load the device details
     */
    async loadDetails(): Promise<void> {
        console.log(`Loading device details for`, this.props.device.id, `... from ${this.props.instanceId}`);
        const details: DeviceDetails | null = await this.props.socket.sendTo(
            this.props.instanceId,
            'dm:deviceDetails',
            this.props.device.id,
        );
        console.log(`Got device details for`, this.props.device.id, details);
        this.setState({ details, data: details?.data || {} });
    }

    /**
     * Copy the device ID to the clipboard
     */
    copyToClipboard = (): void => {
        const textToCopy = this.props.fields.identifier;
        if (!textToCopy) {
            return;
        }
        Utils.copyToClipboard(textToCopy);
        alert(`${getTranslation('copied')} ${textToCopy} ${getTranslation('toClipboard')}!`);
    };

    renderDialog(): JSX.Element | null {
        if (!this.state.open || !this.state.details) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                maxWidth="md"
                onClose={() => this.setState({ open: false })}
            >
                <DialogContent>
                    <JsonConfig
                        instanceId={this.props.instanceId}
                        socket={this.props.socket}
                        schema={this.state.details.schema}
                        data={this.state.data}
                        onChange={(data: Record<string, any> | null) => data && this.setState({ data })}
                        themeName={this.props.themeName}
                        themeType={this.props.themeType}
                        theme={this.props.theme}
                        isFloatComma={this.props.isFloatComma}
                        dateFormat={this.props.dateFormat}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!this.props.alive}
                        variant="contained"
                        color="primary"
                        onClick={() => this.setState({ open: false })}
                        autoFocus
                    >
                        {getTranslation('closeButtonText')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderControlItems(
        controls: DeviceControl[],
        allControls: DeviceControl[],
        colors: { primary: string; secondary: string },
        parentGroupId?: string,
    ): JSX.Element[] {
        return controls
            .filter(control => (parentGroupId ? control.group === parentGroupId : !control.group))
            .map(control => {
                if (control.type === 'group') {
                    const children = allControls.filter(ctrl => ctrl.group === control.id);
                    return (
                        <Accordion key={control.id}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography
                                    component="span"
                                    style={{ display: 'flex', gap: 8, color: control.color }}
                                >
                                    {control.icon ? <Icon src={control.icon} /> : null}
                                    {getTranslation(control.label!)}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails style={{ display: 'flex', flexDirection: 'column' }}>
                                {this.renderControlItems(children, allControls, colors, control.id)}
                            </AccordionDetails>
                        </Accordion>
                    );
                }
                return (
                    <DeviceControlComponent
                        disabled={false}
                        key={control.id}
                        control={control}
                        socket={this.props.socket}
                        colors={colors}
                        deviceId={this.props.device.id}
                        controlHandler={this.props.controlHandler}
                        controlStateHandler={this.props.controlStateHandler}
                    />
                );
            });
    }

    renderControlDialog(): JSX.Element | null {
        if (!this.state.showControlDialog || !this.props.alive) {
            return null;
        }
        const colors = { primary: '#111', secondary: '#888' };
        const allControls = this.props.device.controls || [];
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showControlDialog: false })}
            >
                <DialogTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {this.props.fields.name}
                    <IconButton onClick={() => this.setState({ showControlDialog: false })}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
                    {this.renderControlItems(allControls, allControls, colors)}
                </DialogContent>
            </Dialog>
        );
    }

    renderControls(): JSX.Element | null {
        const colors = { primary: '#111', secondary: '#888' };
        const firstControl = this.props.device.controls?.[0];
        if (
            this.props.device.controls?.length === 1 &&
            firstControl &&
            (firstControl.type === 'icon' || firstControl.type === 'switch') &&
            !firstControl.label
        ) {
            // control can be placed in the button icon
            return (
                <DeviceControlComponent
                    disabled={!this.props.alive}
                    control={firstControl}
                    colors={colors}
                    socket={this.props.socket}
                    deviceId={this.props.device.id}
                    controlHandler={this.props.controlHandler}
                    controlStateHandler={this.props.controlStateHandler}
                />
            );
        }

        if (this.props.device.controls?.length) {
            // place a button and show a control dialog
            return (
                <Fab
                    size="small"
                    style={{ width: 32, height: 32, minHeight: 32 }}
                    disabled={!this.props.alive}
                    onClick={() => this.setState({ showControlDialog: true })}
                >
                    <ControlIcon />
                </Fab>
            );
        }
        return null;
    }

    /**
     * IDs of all actions that are not rendered as a normal button in the footer, because they
     * already have their place in the status line: the reserved actions, the actions with
     * `placement: 'status'` and the actions referenced by a custom indicator.
     */
    private getStatusActionIds(): Set<string> {
        const ids = new Set<string>([ACTIONS.STATUS, ACTIONS.ENABLE_DISABLE, ACTIONS.UPDATE, ACTIONS.BATTERY]);

        for (const indicator of this.props.device.indicators || []) {
            if (indicator.actionId) {
                ids.add(indicator.actionId);
            }
        }
        for (const action of this.props.device.actions || []) {
            if (action.placement === 'status') {
                ids.add(action.id);
            }
        }

        return ids;
    }

    /** True if at least one action is left for the button row at the bottom of the card */
    private hasFooterActions(): boolean {
        const statusActionIds = this.getStatusActionIds();
        return !!this.props.device.actions?.some(action => !statusActionIds.has(action.id));
    }

    /** Resolve how a custom indicator behaves on click by looking up the referenced action */
    private resolveIndicatorAction = (
        actionId: string,
    ): { onClick?: () => void; url?: string; disabled?: boolean } | undefined => {
        const action = this.props.device.actions?.find(a => a.id === actionId);
        if (!action) {
            console.warn(
                `Indicator of device ${JSON.stringify(this.props.device.id)} references the unknown action "${actionId}"`,
            );
            return undefined;
        }

        if ('url' in action && action.url) {
            return { url: getTranslation(action.url), disabled: action.disabled };
        }

        return {
            onClick: this.props.deviceHandler(this.props.device.id, action),
            disabled: action.disabled,
        };
    };

    /** Custom indicators and the actions that requested to be shown in the status line */
    renderIndicators(small?: boolean): JSX.Element | null {
        const reserved: string[] = [ACTIONS.STATUS, ACTIONS.ENABLE_DISABLE, ACTIONS.UPDATE, ACTIONS.BATTERY];
        const statusActions: DeviceAction[] =
            this.props.device.actions?.filter(a => a.placement === 'status' && !reserved.includes(a.id)) || [];

        // An indicator switched off by the user is not shown at all. An action referenced by it stays
        // out of the footer too, as hiding the indicator was an explicit decision of the user.
        const indicators = this.props.hiddenIndicators?.length
            ? this.props.device.indicators?.filter(indicator => !this.props.hiddenIndicators!.includes(indicator.id))
            : this.props.device.indicators;

        if (!indicators?.length && !statusActions.length) {
            return null;
        }

        return (
            <StatusIndicators
                indicators={indicators}
                theme={this.props.theme}
                stateOrObjectHandler={this.props.stateOrObjectHandler}
                disabled={!this.props.alive}
                resolveAction={this.resolveIndicatorAction}
                style={{ marginTop: small ? 2 : 4 }}
            >
                {statusActions.map(action => (
                    <DeviceActionButton
                        disabled={!this.props.alive}
                        key={action.id}
                        deviceId={this.props.device.id}
                        action={action}
                        deviceHandler={this.props.deviceHandler}
                    />
                ))}
            </StatusIndicators>
        );
    }

    renderActions(): JSX.Element[] | null {
        const statusActionIds = this.getStatusActionIds();
        const actions = this.props.device.actions?.filter(a => !statusActionIds.has(a.id));

        return actions?.length
            ? actions.map(a => (
                  <DeviceActionButton
                      disabled={!this.props.alive}
                      key={a.id}
                      deviceId={this.props.device.id}
                      action={a}
                      deviceHandler={this.props.deviceHandler}
                  />
              ))
            : null;
    }

    renderSmall(): JSX.Element {
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
              ? this.props.device.status
              : [this.props.device.status];

        const iconSrc = this.state.localIcon || this.props.fields.icon;
        const icon = iconSrc ? (
            <DeviceTypeIcon
                src={iconSrc}
                style={styles.imgStyle}
            />
        ) : (
            <NoImageIcon style={styles.imgStyle} />
        );
        const headerStyle = this.getCardHeaderStyle(this.props.theme);

        const title: string = this.state.details?.data?.name || this.props.device.name || '';

        return (
            <Paper
                style={this.props.fillContainer ? filledCardSize : smallCardSize}
                sx={styles.cardStyle}
            >
                {/* Header */}
                <Box
                    sx={headerStyle}
                    style={{ ...styles.headerStyle, minHeight: 48 }}
                >
                    <div style={{ ...styles.imgAreaStyle, height: 32, width: 32 }}>
                        {this.props.uploadImagesToInstance ? (
                            <DeviceImageUpload
                                uploadImagesToInstance={this.props.uploadImagesToInstance}
                                deviceId={this.props.device.id}
                                manufacturer={this.props.fields.manufacturer}
                                model={this.props.fields.model}
                                onImageSelect={(imageData: string): void => {
                                    if (imageData) {
                                        this.setState({ localIcon: imageData });
                                    }
                                }}
                                socket={this.props.socket}
                            />
                        ) : null}
                        {icon}
                    </div>
                    <Box
                        style={{ ...styles.titleStyle, fontSize: 14 }}
                        title={title.length > 15 ? title : undefined}
                        sx={theme => ({ color: headerStyle.color || theme.palette.secondary.contrastText })}
                    >
                        {this.state.details?.data?.name || this.props.fields.name}
                    </Box>
                    {this.props.fields.hasDetails ? (
                        <Fab
                            disabled={!this.props.alive}
                            size="small"
                            style={styles.detailsButtonStyle}
                            onClick={() => {
                                if (!this.state.open) {
                                    this.loadDetails().catch(console.error);
                                    this.setState({ open: true });
                                }
                            }}
                            color="primary"
                        >
                            <MoreVertIcon />
                        </Fab>
                    ) : null}
                </Box>
                {/* Status */}
                <div style={{ ...styles.statusStyle, height: 'auto', padding: '8px 15px 0 15px' }}>
                    {status.map((s, i) => (
                        <DeviceStatusComponent
                            key={i}
                            socket={this.props.socket}
                            deviceId={this.props.device.id}
                            connectionType={this.props.fields.connectionType}
                            status={s}
                            enabled={this.props.fields.enabled}
                            statusAction={this.props.device.actions?.find(a => a.id === ACTIONS.STATUS)}
                            disableEnableAction={this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE)}
                            update={i === 0 ? this.props.device.update : undefined}
                            updateAction={
                                i === 0 ? this.props.device.actions?.find(a => a.id === ACTIONS.UPDATE) : undefined
                            }
                            batteryAction={this.props.device.actions?.find(a => a.id === ACTIONS.BATTERY)}
                            deviceHandler={this.props.deviceHandler}
                            theme={this.props.theme}
                            stateOrObjectHandler={this.props.stateOrObjectHandler}
                        />
                    ))}
                    {this.renderIndicators(true)}
                </div>
                {/* Body */}
                <div style={styles.bodyStyle}>
                    <Typography
                        variant="body2"
                        style={{ ...styles.deviceInfoStyle, padding: '10px 10px 0 10px' }}
                    >
                        {this.props.fields.identifier ? (
                            <div
                                onClick={this.copyToClipboard}
                                style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                            >
                                <b>{getText(this.props.identifierLabel)}:</b>
                                <span style={{ marginLeft: 4 }}>{this.props.fields.identifier}</span>
                            </div>
                        ) : null}
                        {this.props.fields.manufacturer ? (
                            <Tooltip
                                title={getTranslation('manufacturer')}
                                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                            >
                                <div>{this.props.fields.manufacturer}</div>
                            </Tooltip>
                        ) : null}
                        {this.props.fields.model ? (
                            <Tooltip
                                title={getTranslation('model')}
                                slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                            >
                                <div>{this.props.fields.model}</div>
                            </Tooltip>
                        ) : null}
                    </Typography>
                    {this.props.device.customInfo ? (
                        // The bottom padding is not symmetry for its own sake: the footer below is
                        // only rendered when the device has actions or controls, so without it the
                        // last row would sit flush on the card's lower edge.
                        <div style={{ padding: '0 10px 10px' }}>
                            <JsonConfig
                                instanceId={this.props.instanceId}
                                socket={this.props.socket}
                                schema={this.props.device.customInfo.schema}
                                data={this.props.device.customInfo.data || {}}
                                onChange={(_data: Record<string, any> | null) => {
                                    /* ignore */
                                }}
                                themeName={this.props.themeName}
                                themeType={this.props.themeType}
                                theme={this.props.theme}
                                isFloatComma={this.props.isFloatComma}
                                dateFormat={this.props.dateFormat}
                            />
                        </div>
                    ) : null}
                    {/* Footer */}
                    {!!(this.hasFooterActions() || this.props.device.controls?.length) && (
                        <div
                            style={{
                                marginTop: 'auto',
                                display: 'flex',
                                gap: 4,
                                paddingBottom: 5,
                                minHeight: 34,
                                paddingLeft: 8,
                                paddingRight: 8,
                            }}
                        >
                            {this.renderActions()}
                            <div style={{ flexGrow: 1 }} />
                            {this.renderControls()}
                        </div>
                    )}
                </div>
                {this.renderDialog()}
                {this.renderControlDialog()}
            </Paper>
        );
    }

    getCardHeaderStyle(theme: IobTheme, maxWidth?: number): React.CSSProperties {
        const backgroundColor =
            this.props.fields.backgroundColor === 'primary'
                ? theme.palette.primary.main
                : this.props.fields.backgroundColor === 'secondary'
                  ? theme.palette.secondary.main
                  : this.props.fields.backgroundColor || theme.palette.secondary.main;

        let color;
        if (
            this.props.fields.color &&
            this.props.fields.color !== 'primary' &&
            this.props.fields.color !== 'secondary'
        ) {
            // Color was directly defined
            color = this.props.fields.color;
        } else if (this.props.fields.color === 'primary') {
            color = theme.palette.primary.main;
        } else if (this.props.fields.color === 'secondary') {
            color = theme.palette.secondary.main;
        } else {
            // Color was not defined
            if (this.props.fields.backgroundColor === 'primary') {
                color = theme.palette.primary.contrastText;
            } else if (this.props.fields.backgroundColor === 'secondary' || !this.props.fields.backgroundColor) {
                color = theme.palette.secondary.contrastText;
            } else {
                color = Utils.invertColor(backgroundColor, true);
            }
        }

        return {
            backgroundColor,
            color,
            maxWidth,
        };
    }

    renderBig(): JSX.Element {
        const status = !this.props.device.status
            ? []
            : Array.isArray(this.props.device.status)
              ? this.props.device.status
              : [this.props.device.status];

        const iconSrc = this.state.localIcon || this.props.fields.icon;
        const icon = iconSrc ? (
            <DeviceTypeIcon
                src={iconSrc}
                style={styles.imgStyle}
            />
        ) : (
            <NoImageIcon style={styles.imgStyle} />
        );
        const headerStyle = this.getCardHeaderStyle(this.props.theme);

        const title: string = this.state.details?.data?.name || this.props.device.name || '';

        return (
            <Paper
                style={this.props.fillContainer ? filledCardSize : cardSize}
                sx={styles.cardStyle}
            >
                {/* Header */}
                <Box
                    sx={headerStyle}
                    style={styles.headerStyle}
                >
                    <div style={styles.imgAreaStyle}>
                        {this.props.uploadImagesToInstance ? (
                            <DeviceImageUpload
                                uploadImagesToInstance={this.props.uploadImagesToInstance}
                                deviceId={this.props.device.id}
                                manufacturer={this.props.fields.manufacturer}
                                model={this.props.fields.model}
                                onImageSelect={(imageData: string): void => {
                                    if (imageData) {
                                        this.setState({ localIcon: imageData });
                                    }
                                }}
                                socket={this.props.socket}
                            />
                        ) : null}
                        {icon}
                    </div>
                    <Box
                        style={styles.titleStyle}
                        title={title.length > 20 ? title : undefined}
                        sx={theme => ({ color: headerStyle.color || theme.palette.secondary.contrastText })}
                    >
                        {this.state.details?.data?.name || this.props.fields.name}
                    </Box>
                    {this.props.fields.hasDetails ? (
                        <Fab
                            disabled={!this.props.alive}
                            size="small"
                            style={styles.detailsButtonStyle}
                            onClick={() => {
                                if (!this.state.open) {
                                    this.loadDetails().catch(console.error);
                                    this.setState({ open: true });
                                }
                            }}
                            color="primary"
                        >
                            <MoreVertIcon />
                        </Fab>
                    ) : null}
                </Box>
                {/* Body */}
                <div style={styles.statusStyle}>
                    {status.map((s, i) => (
                        <DeviceStatusComponent
                            key={i}
                            socket={this.props.socket}
                            deviceId={this.props.device.id}
                            connectionType={this.props.fields.connectionType}
                            status={s}
                            enabled={this.props.fields.enabled}
                            statusAction={this.props.device.actions?.find(a => a.id === ACTIONS.STATUS)}
                            disableEnableAction={this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE)}
                            update={i === 0 ? this.props.device.update : undefined}
                            updateAction={
                                i === 0 ? this.props.device.actions?.find(a => a.id === ACTIONS.UPDATE) : undefined
                            }
                            batteryAction={this.props.device.actions?.find(a => a.id === ACTIONS.BATTERY)}
                            deviceHandler={this.props.deviceHandler}
                            theme={this.props.theme}
                            stateOrObjectHandler={this.props.stateOrObjectHandler}
                        />
                    ))}
                    {this.renderIndicators()}
                </div>
                <div style={styles.bodyStyle}>
                    <Typography
                        variant="body1"
                        style={styles.deviceInfoStyle}
                    >
                        {this.props.fields.identifier ? (
                            <div onClick={this.copyToClipboard}>
                                <b style={{ marginRight: 4 }}>{getText(this.props.identifierLabel)}:</b>
                                {this.props.fields.identifier}
                            </div>
                        ) : null}
                        {this.props.fields.manufacturer ? (
                            <div>
                                <b style={{ marginRight: 4 }}>{getTranslation('manufacturer')}:</b>
                                {this.props.fields.manufacturer}
                            </div>
                        ) : null}
                        {this.props.fields.model ? (
                            <div>
                                <b style={{ marginRight: 4 }}>{getTranslation('model')}:</b>
                                {this.props.fields.model}
                            </div>
                        ) : null}
                    </Typography>
                    {this.props.device.customInfo ? (
                        // See the compact card above — the footer that used to provide the gap is
                        // conditional, so the padding has to be here.
                        <div style={{ padding: '0 16px 16px' }}>
                            <JsonConfig
                                instanceId={this.props.instanceId}
                                socket={this.props.socket}
                                schema={this.props.device.customInfo.schema}
                                data={this.props.device.customInfo.data || {}}
                                onChange={(_data: Record<string, any> | null) => {
                                    /* ignore */
                                }}
                                themeName={this.props.themeName}
                                themeType={this.props.themeType}
                                theme={this.props.theme}
                                isFloatComma={this.props.isFloatComma}
                                dateFormat={this.props.dateFormat}
                            />
                        </div>
                    ) : null}
                    {/* Footer */}
                    {!!(this.hasFooterActions() || this.props.device.controls?.length) && (
                        <div
                            style={{
                                marginTop: 'auto',
                                display: 'flex',
                                gap: 8,
                                paddingBottom: 5,
                                minHeight: 34,
                                paddingLeft: 10,
                                paddingRight: 10,
                            }}
                        >
                            {this.renderActions()}
                            <div style={{ flexGrow: 1 }} />
                            {this.renderControls()}
                        </div>
                    )}
                </div>
                {this.renderDialog()}
                {this.renderControlDialog()}
            </Paper>
        );
    }

    render(): JSX.Element {
        if (this.props.smallCards) {
            return this.renderSmall();
        }

        return this.renderBig();
    }
}

type DeviceCardSkeletonProps = Pick<DeviceCardProps, 'smallCards' | 'theme'>;

export class DeviceCardSkeleton extends PureComponent<DeviceCardSkeletonProps> {
    render(): JSX.Element {
        if (this.props.smallCards) {
            return this.renderSmall();
        }

        return this.renderBig();
    }

    renderSmall(): JSX.Element {
        const headerStyle = this.getCardHeaderStyle(this.props.theme);

        return (
            <Paper
                sx={styles.cardStyle}
                style={smallCardSize}
            >
                <Box
                    sx={headerStyle}
                    style={{ ...styles.headerStyle, minHeight: 48 }}
                >
                    <div style={{ ...styles.imgAreaStyle, height: 32, width: 32 }}>
                        <Skeleton
                            variant="rounded"
                            width={24}
                            height={24}
                        />
                    </div>
                    <Box
                        style={{ ...styles.titleStyle, fontSize: 14, minWidth: '50%' }}
                        sx={theme => ({
                            color: headerStyle.color || theme.palette.secondary.contrastText,
                        })}
                    >
                        <Skeleton />
                    </Box>
                </Box>
                <div style={{ ...styles.statusStyle, height: 'auto', padding: '8px 15px 0 15px' }} />
                <div style={styles.bodyStyle}>
                    <Typography
                        variant="body2"
                        style={{ ...styles.deviceInfoStyle, padding: '10px 10px 0 10px' }}
                    >
                        <div>
                            <Skeleton />
                        </div>
                        <div>
                            <Skeleton />
                        </div>
                        <div>
                            <Skeleton />
                        </div>
                    </Typography>
                </div>
            </Paper>
        );
    }

    renderBig(): JSX.Element {
        const headerStyle = this.getCardHeaderStyle(this.props.theme);

        return (
            <Paper
                sx={styles.cardStyle}
                style={cardSize}
            >
                <Box
                    sx={headerStyle}
                    style={styles.headerStyle}
                >
                    <div style={styles.imgAreaStyle}>
                        <Skeleton
                            variant="rounded"
                            width={24}
                            height={24}
                        />
                    </div>
                    <Box
                        style={styles.titleStyle}
                        sx={theme => ({
                            color: headerStyle.color || theme.palette.secondary.contrastText,
                            minWidth: '50%',
                        })}
                    >
                        <Skeleton />
                    </Box>
                </Box>
                <div style={styles.statusStyle}></div>
                <div style={styles.bodyStyle}>
                    <Typography
                        variant="body1"
                        style={styles.deviceInfoStyle}
                    >
                        <div>
                            <Skeleton />
                        </div>
                        <div>
                            <Skeleton />
                        </div>
                        <div>
                            <Skeleton />
                        </div>
                    </Typography>
                </div>
            </Paper>
        );
    }

    // eslint-disable-next-line class-methods-use-this
    getCardHeaderStyle(theme: IobTheme, maxWidth?: number): React.CSSProperties {
        const backgroundColor = theme.palette.secondary.main;
        const color = theme.palette.secondary.contrastText;

        return {
            backgroundColor,
            color,
            maxWidth,
        };
    }
}
