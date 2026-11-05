import React, { PureComponent, useState, type JSX } from 'react';
import { Close as CloseIcon, VideogameAsset as ControlIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
    IconCopyToClipboard,
    IconFolder,
} from '@iobroker/gui-components';
import DeviceActionButton from './DeviceActionButton';
import DeviceControlComponent from './DeviceControl';
import DeviceImageUpload from './DeviceImageUpload';
import DeviceStatusComponent, { DeviceLed } from './DeviceStatus';
import JsonConfig from './JsonConfig';
import { StatusIndicators } from './StatusIndicator';
import Switch from './Switch';
import type {
    ActionBase,
    ControlBase,
    ControlState,
    DeviceDetails,
    DeviceAction,
    DeviceControl,
    DeviceInfo,
    DeviceId,
    DeviceStatus,
} from './protocol/api';

import { getText, getTranslation } from './Utils';
import { ensureDmStyles, getThemeVars } from './styles';
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
export const CARD_MIN_HEIGHT = 250;
export const CARD_MARGIN = 8;

export const SMALL_CARD_WIDTH = 210;
export const SMALL_CARD_MIN_HEIGHT = 190;
export const SMALL_CARD_MARGIN = 5;

const cardSize: React.CSSProperties = { width: CARD_WIDTH, minHeight: CARD_MIN_HEIGHT, margin: CARD_MARGIN };
const smallCardSize: React.CSSProperties = {
    width: SMALL_CARD_WIDTH,
    minHeight: SMALL_CARD_MIN_HEIGHT,
    margin: SMALL_CARD_MARGIN,
};
/** A card that sits in a container which already has the footprint of a card */
const filledCardSize: React.CSSProperties = { width: '100%', margin: 0 };

const tooltipSlotProps = { popper: { sx: { pointerEvents: 'none' } } };

/**
 * Icons read from the file storage of the adapter, keyed by `<instance>/<file>`.
 *
 * A card is unmounted and mounted again while scrolling, and without this cache every one of those
 * would repeat the `readFile` round trip for an icon that is very often not there at all.
 */
const fileIconCache = new Map<string, string>();

/**
 * True if the icon is a picture (a photo of the device, an uploaded image). A picture keeps its own
 * colors and sits on a neutral tile; a device type or a symbol takes the color of the device.
 */
function isPicture(src: string): boolean {
    if (src.startsWith('data:image/svg')) {
        return false;
    }
    return src.startsWith('data:image') || src.includes('/') || /\.(png|jpe?g|gif|webp|ico|bmp)$/i.test(src);
}

/** The status entries of a device as a list */
function getStatusList(device: DeviceInfo): DeviceStatus[] {
    if (!device.status) {
        return [];
    }
    return Array.isArray(device.status) ? device.status : [device.status];
}

/** A group of controls in the control dialog: the folder opens with the group */
function ControlGroup(props: { control: DeviceControl; children: React.ReactNode }): JSX.Element {
    const [expanded, setExpanded] = useState(false);
    const { control } = props;
    return (
        <Accordion
            expanded={expanded}
            onChange={(_e, isExpanded) => setExpanded(isExpanded)}
            disableGutters
        >
            <AccordionSummary
                expandIcon={<IconFolder open={expanded} />}
                // The folder shows the state itself, it must not be turned around like the arrow
                sx={{ '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'none' } }}
            >
                <Typography
                    component="span"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, color: control.color }}
                >
                    {control.icon ? <Icon src={control.icon} /> : null}
                    {getTranslation(control.label!)}
                </Typography>
            </AccordionSummary>
            <AccordionDetails style={{ display: 'flex', flexDirection: 'column' }}>{props.children}</AccordionDetails>
        </Accordion>
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
 * The card is laid out like the type plate of a device: its symbol (in the color of the device, with
 * an LED for the connection) and its name at the top, the status line below, then the facts and at
 * the bottom the actions. The status values are neutral while all is well and tinted when they need
 * attention, so that in a long list the devices with a problem stand out.
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
        ensureDmStyles();

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
     * Copy the device ID to the clipboard. The copy symbol shows a check mark as confirmation.
     */
    copyToClipboard = (): void => {
        const textToCopy = this.props.fields.identifier;
        if (textToCopy) {
            Utils.copyToClipboard(textToCopy);
        }
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
                        <ControlGroup
                            key={control.id}
                            control={control}
                        >
                            {this.renderControlItems(children, allControls, colors, control.id)}
                        </ControlGroup>
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
                <IconButton
                    size="small"
                    color="primary"
                    disabled={!this.props.alive}
                    onClick={() => this.setState({ showControlDialog: true })}
                >
                    <ControlIcon className="dm-ani dm-ani-tick" />
                </IconButton>
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
    renderIndicators(): JSX.Element | null {
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
                // The indicators flow in the status line together with the built-in values
                style={{ display: 'contents' }}
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

    /** Color of the device symbol and of the glyph on it */
    getAccent(theme: IobTheme): { background: string; color: string } {
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

        return { background: backgroundColor, color };
    }

    /** The device symbol with the LED and, if allowed, the image upload */
    renderAvatar(name: string, small: boolean): JSX.Element {
        const iconSrc = this.state.localIcon || this.props.fields.icon;
        const picture = !!iconSrc && isPicture(iconSrc);
        const accent = this.getAccent(this.props.theme);
        const firstStatus = getStatusList(this.props.device)[0];

        let glyph: JSX.Element;
        if (iconSrc) {
            // The size is given inline, because `DeviceTypeIcon` sets an inline size of its own
            const glyphSize = small ? 20 : 26;
            glyph = (
                <DeviceTypeIcon
                    src={iconSrc}
                    className="dm-avatar-glyph"
                    style={
                        picture
                            ? { width: '100%', height: '100%', objectFit: 'contain' }
                            : { width: glyphSize, height: glyphSize, color: accent.color }
                    }
                />
            );
        } else {
            // Without an icon, the initial of the name gives each device its own symbol
            glyph = <span className="dm-avatar-letter">{Array.from(name.trim())[0] || '?'}</span>;
        }

        return (
            <div
                className={picture ? 'dm-avatar dm-avatar-img' : 'dm-avatar'}
                style={
                    picture
                        ? undefined
                        : ({
                              '--dm-accent': accent.background,
                              '--dm-accent-text': accent.color,
                          } as React.CSSProperties)
                }
            >
                {glyph}
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
                {firstStatus ? (
                    <DeviceLed
                        status={firstStatus}
                        stateOrObjectHandler={this.props.stateOrObjectHandler}
                        alive={this.props.alive}
                        enabled={this.props.fields.enabled}
                    />
                ) : null}
            </div>
        );
    }

    /** The switch that enables or disables the device */
    renderEnabled(small: boolean): JSX.Element | null {
        if (typeof this.props.fields.enabled !== 'boolean') {
            return null;
        }
        const action = this.props.device.actions?.find(a => a.id === ACTIONS.ENABLE_DISABLE);
        const tooltip = this.props.fields.enabled
            ? getTranslation('disableIconTooltip')
            : getTranslation('enableIconTooltip');
        return (
            <div className="dm-status-end">
                <Tooltip
                    title={tooltip}
                    slotProps={tooltipSlotProps}
                >
                    <div>
                        <Switch
                            size={small ? 'small' : undefined}
                            checked={this.props.fields.enabled}
                            disabled={!action || !this.props.alive}
                            ariaLabel={tooltip}
                            onChange={() => action && this.props.deviceHandler(this.props.device.id, action)()}
                            theme={this.props.theme}
                        />
                    </div>
                </Tooltip>
            </div>
        );
    }

    /** Identifier, manufacturer and model as a table of labels and values */
    renderFacts(): JSX.Element | null {
        const { identifier, manufacturer, model } = this.props.fields;
        if (!identifier && !manufacturer && !model) {
            return null;
        }
        return (
            <div className="dm-facts">
                {identifier ? (
                    <>
                        <span className="dm-fact-label">{getText(this.props.identifierLabel)}</span>
                        <span className="dm-fact-copy">
                            <span title={identifier}>{identifier}</span>
                            <Tooltip
                                title={getTranslation('ctcButtonText')}
                                slotProps={tooltipSlotProps}
                            >
                                <IconButton
                                    size="small"
                                    className="dm-copy-btn"
                                    aria-label={getTranslation('ctcButtonText')}
                                    onClick={this.copyToClipboard}
                                >
                                    {/* Listens to the click on the button and draws a check mark */}
                                    <IconCopyToClipboard />
                                </IconButton>
                            </Tooltip>
                        </span>
                    </>
                ) : null}
                {manufacturer ? (
                    <>
                        <span className="dm-fact-label">{getTranslation('manufacturer')}</span>
                        <span
                            className="dm-fact-value"
                            title={manufacturer}
                        >
                            {manufacturer}
                        </span>
                    </>
                ) : null}
                {model ? (
                    <>
                        <span className="dm-fact-label">{getTranslation('model')}</span>
                        <span
                            className="dm-fact-value"
                            title={model}
                        >
                            {model}
                        </span>
                    </>
                ) : null}
            </div>
        );
    }

    render(): JSX.Element {
        const small = !!this.props.smallCards;
        const status = getStatusList(this.props.device);
        const name: string = this.state.details?.data?.name || this.props.fields.name || '';
        const off = this.props.fields.enabled === false;

        let className = small ? 'dm-card dm-small' : 'dm-card';
        if (off) {
            className += ' dm-off';
        }

        const size = this.props.fillContainer ? filledCardSize : small ? smallCardSize : cardSize;

        return (
            <div
                className={className}
                style={{ ...getThemeVars(this.props.theme), ...size }}
            >
                <div className="dm-head">
                    {this.renderAvatar(name, small)}
                    <div
                        className="dm-name"
                        title={name.length > (small ? 15 : 20) ? name : undefined}
                    >
                        {name}
                    </div>
                    {this.props.fields.hasDetails ? (
                        <div className="dm-head-end">
                            <IconButton
                                size="small"
                                disabled={!this.props.alive}
                                aria-label={getTranslation('moreInformation')}
                                onClick={() => {
                                    if (!this.state.open) {
                                        this.loadDetails().catch(console.error);
                                        this.setState({ open: true });
                                    }
                                }}
                            >
                                <MoreVertIcon className="dm-ani dm-ani-turn" />
                            </IconButton>
                        </div>
                    ) : null}
                </div>
                <div className="dm-status">
                    {status.map((s, i) => (
                        <DeviceStatusComponent
                            key={i}
                            socket={this.props.socket}
                            deviceId={this.props.device.id}
                            connectionType={this.props.fields.connectionType}
                            status={s}
                            statusAction={this.props.device.actions?.find(a => a.id === ACTIONS.STATUS)}
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
                    {this.renderEnabled(small)}
                </div>
                {this.renderFacts()}
                {this.props.device.customInfo ? (
                    <div className="dm-custom">
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
                {this.hasFooterActions() || this.props.device.controls?.length ? (
                    <div className="dm-foot">
                        {this.renderActions()}
                        <div className="dm-foot-end">{this.renderControls()}</div>
                    </div>
                ) : null}
                {this.renderDialog()}
                {this.renderControlDialog()}
            </div>
        );
    }
}

type DeviceCardSkeletonProps = Pick<DeviceCardProps, 'smallCards' | 'theme'>;

/** Placeholder of a device that is not loaded yet, with the layout of the card */
export class DeviceCardSkeleton extends PureComponent<DeviceCardSkeletonProps> {
    constructor(props: DeviceCardSkeletonProps) {
        super(props);
        ensureDmStyles();
    }

    render(): JSX.Element {
        const small = !!this.props.smallCards;
        return (
            <div
                className={small ? 'dm-card dm-small dm-skeleton' : 'dm-card dm-skeleton'}
                style={{ ...getThemeVars(this.props.theme), ...(small ? smallCardSize : cardSize) }}
            >
                <div className="dm-head">
                    <div className="dm-avatar" />
                    <div className="dm-name">
                        <Skeleton width="70%" />
                    </div>
                </div>
                <div className="dm-status">
                    <Skeleton
                        variant="rounded"
                        width={small ? 120 : 150}
                        height={20}
                    />
                </div>
                <div className="dm-facts">
                    {[0, 1, 2].map(i => (
                        <React.Fragment key={i}>
                            <Skeleton width={small ? 42 : 56} />
                            <Skeleton width={`${70 - i * 12}%`} />
                        </React.Fragment>
                    ))}
                </div>
                <div className="dm-foot">
                    <Skeleton
                        variant="rounded"
                        width={small ? 110 : 150}
                        height={20}
                    />
                </div>
            </div>
        );
    }
}
