import { PureComponent, type JSX } from 'react';
import { type Connection, type IobTheme, type ThemeName, type ThemeType } from '@iobroker/gui-components';
import type { ActionBase, ControlBase, ControlState, DeviceDetails, DeviceControl, DeviceInfo, DeviceId } from './protocol/api';
import type { StateOrObjectHandler } from './StateOrObjectHandler';
import type { ResolvedDeviceFields } from './DeviceFields';
export type { DeviceFilterField } from './DeviceFields';
/**
 * Footprint of a card. The list needs it to give a not yet rendered card a placeholder of exactly
 * the same size, so that neither the layout nor the length of the scrollbar changes.
 */
export declare const CARD_WIDTH = 300;
export declare const CARD_MIN_HEIGHT = 250;
export declare const CARD_MARGIN = 8;
export declare const SMALL_CARD_WIDTH = 210;
export declare const SMALL_CARD_MIN_HEIGHT = 190;
export declare const SMALL_CARD_MARGIN = 5;
interface DeviceCardProps {
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
    uploadImagesToInstance?: string;
    deviceHandler: (deviceId: DeviceId, action: ActionBase) => () => void;
    controlHandler: (deviceId: DeviceId, control: ControlBase, state: ControlState) => () => Promise<ioBroker.State | null>;
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
    private mounted;
    constructor(props: DeviceCardProps);
    /**
     * Key of the icon in the file storage, or `null` if the device brings its own icon.
     *
     * The file is named after manufacturer and model, both of which may be bound to a state or an
     * object and therefore arrive only after the first render.
     */
    private static iconCacheKey;
    fetchIcon(): Promise<void>;
    componentDidMount(): void;
    componentDidUpdate(prevProps: DeviceCardProps): void;
    componentWillUnmount(): void;
    /**
     * Load the device details
     */
    loadDetails(): Promise<void>;
    /**
     * Copy the device ID to the clipboard. The copy symbol shows a check mark as confirmation.
     */
    copyToClipboard: () => void;
    renderDialog(): JSX.Element | null;
    renderControlItems(controls: DeviceControl[], allControls: DeviceControl[], colors: {
        primary: string;
        secondary: string;
    }, parentGroupId?: string): JSX.Element[];
    renderControlDialog(): JSX.Element | null;
    renderControls(): JSX.Element | null;
    /**
     * IDs of all actions that are not rendered as a normal button in the footer, because they
     * already have their place in the status line: the reserved actions, the actions with
     * `placement: 'status'` and the actions referenced by a custom indicator.
     */
    private getStatusActionIds;
    /** True if at least one action is left for the button row at the bottom of the card */
    private hasFooterActions;
    /** Resolve how a custom indicator behaves on click by looking up the referenced action */
    private resolveIndicatorAction;
    /** Custom indicators and the actions that requested to be shown in the status line */
    renderIndicators(): JSX.Element | null;
    renderActions(): JSX.Element[] | null;
    /** Color of the device symbol and of the glyph on it */
    getAccent(theme: IobTheme): {
        background: string;
        color: string;
    };
    /** The device symbol with the LED and, if allowed, the image upload */
    renderAvatar(name: string, small: boolean): JSX.Element;
    /** The switch that enables or disables the device */
    renderEnabled(small: boolean): JSX.Element | null;
    /** Identifier, manufacturer and model as a table of labels and values */
    renderFacts(): JSX.Element | null;
    render(): JSX.Element;
}
type DeviceCardSkeletonProps = Pick<DeviceCardProps, 'smallCards' | 'theme'>;
/** Placeholder of a device that is not loaded yet, with the layout of the card */
export declare class DeviceCardSkeleton extends PureComponent<DeviceCardSkeletonProps> {
    constructor(props: DeviceCardSkeletonProps);
    render(): JSX.Element;
}
