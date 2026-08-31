import React, { type JSX } from 'react';
import {
    IconButton,
    InputAdornment,
    TextField,
    Toolbar,
    Tooltip,
    LinearProgress,
    Select,
    MenuItem,
    Card,
    CardActionArea,
    CardContent,
    Typography,
    Menu,
    Checkbox,
    ListSubheader,
} from '@mui/material';

import {
    ArrowBack,
    Clear,
    QuestionMark,
    Refresh,
    FilterAlt,
    FilterAltOff,
    SystemUpdateAlt,
    BatteryAlert,
    Tune,
} from '@mui/icons-material';

import { I18n, DeviceTypeIcon, Icon, InfoBox } from '@iobroker/gui-components';
import type { DeviceId, DeviceInfo, DeviceStatus, InstanceDetails, StatusIndicator } from './protocol/api';

import DeviceCard, {
    DeviceCardSkeleton,
    CARD_WIDTH,
    CARD_MIN_HEIGHT,
    CARD_MARGIN,
    SMALL_CARD_WIDTH,
    SMALL_CARD_MIN_HEIGHT,
    SMALL_CARD_MARGIN,
} from './DeviceCard';
import { getTranslation, renderIcon } from './Utils';
import Communication, { type CommunicationProps, type CommunicationState } from './Communication';
import InstanceActionButton from './InstanceActionButton';
import { StatusIndicators } from './StatusIndicator';
import { StateOrObjectHandler } from './StateOrObjectHandler';
import { DeviceFieldsResolver, type DeviceFilterField } from './DeviceFields';
import { LazyRender, LazyRenderObserver } from './LazyRender';

import de from './i18n/de.json';
import en from './i18n/en.json';
import ru from './i18n/ru.json';
import pt from './i18n/pt.json';
import nl from './i18n/nl.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import es from './i18n/es.json';
import pl from './i18n/pl.json';
import uk from './i18n/uk.json';
import zhCn from './i18n/zh-cn.json';

/**
 * The key of a device. It is used as React key, for the resolved fields and for the filter, so it is
 * computed on every render for every device. `JSON.stringify` adds up noticeably with a few hundred
 * devices, therefore the result is cached per device object.
 */
const deviceKeys = new WeakMap<DeviceInfo, string>();

function deviceKey(device: DeviceInfo): string {
    let key = deviceKeys.get(device);
    if (key === undefined) {
        key = JSON.stringify(device.id);
        deviceKeys.set(device, key);
    }
    return key;
}

/**
 * How many skeletons are shown at most while loading. They stand for devices that are not there yet,
 * and a few hundred pulsing placeholders cost more than the cards they are waiting for.
 */
const MAX_SKELETONS = 12;

/** Returns true if any of the device status objects carries a battery value */
function hasBatteryStatus(status?: DeviceStatus | DeviceStatus[]): boolean {
    if (!status || typeof status === 'string') {
        return false;
    }
    const list = Array.isArray(status) ? status : [status];
    return list.some(entry => typeof entry !== 'string' && entry.battery !== undefined);
}

interface DeviceListProps extends CommunicationProps {
    /** Instance to upload images to, like `adapterName.X` */
    uploadImagesToInstance?: string;
    /** Filter devices with this string */
    filter?: string;
    /** If this component is used in GUI with own toolbar. `false` if this list is used with multiple instances and true if only with one (in this case, it will monitor alive itself */
    embedded?: boolean;
    /** If embedded, this text is shown in the toolbar */
    title?: string;
    /** Style of a component that displays all devices */
    style?: React.CSSProperties;
    /** Use small cards for devices */
    smallCards?: boolean;
    /** To trigger the reload of devices, just change this variable */
    triggerLoad?: number;
}

interface DeviceListState extends CommunicationState {
    devices: DeviceInfo[];
    totalDevices?: number;
    filter: string;
    filterText: string;
    instanceInfo: InstanceDetails | null;
    loading: boolean | null;
    alive: boolean | null;
    triggerLoad: number;
    groupKey: string;
    dmInstances: { [instanceName: string]: { title: string; icon: string; instance: number } } | null;
    apiVersionError: boolean;
    /** Show only devices that have an available update */
    onlyUpdatable: boolean;
    /** Show only devices that have a battery problem */
    onlyBatteryProblem: boolean;
    /** Device field the text filter applies to */
    filterField: DeviceFilterField;
    /** Distinct resolved model values across the loaded devices (for the model filter dropdown) */
    modelOptions: string[];
    /** Visibility of the configurable indicators, as explicitly chosen by the user for this instance */
    indicatorVisibility: Record<string, boolean>;
    /** Anchor of the indicator visibility menu */
    indicatorsAnchor: HTMLElement | null;
    /** Increased whenever a device field bound to a state or an object changed, to trigger a re-render */
    fieldsVersion: number;
}

/**
 * Device List Component
 */
export default class DeviceList extends Communication<DeviceListProps, DeviceListState> {
    static i18nInitialized = false;

    private lastInstance: string;

    private lastAliveSubscribe = '';

    /**
     * Synchronous mirror of `state.alive`. `setState` is asynchronous, so the guard in `aliveHandler`
     * cannot rely on `state.alive` being committed yet when `subscribeState` replays the current value.
     * This field is always updated synchronously together with `setState({ alive })` and is the source
     * of truth for the "did alive actually change?" check, which prevents the double device load.
     */
    private alive: boolean | null = null;

    private lastTriggerLoad = 0;

    private filterTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly language: ioBroker.Languages = I18n.getLanguage();

    /**
     * One handler for the toolbar indicators and for all cards, so that several devices referring to
     * the same object or state share a single subscription on the socket.
     */
    private readonly stateOrObjectHandler: StateOrObjectHandler;

    /** Resolves the device fields that may be bound to a state or an object (name, model, ...) */
    private readonly fieldsResolver: DeviceFieldsResolver;

    /** One `IntersectionObserver` for all cards: only what is near the viewport is really rendered */
    private readonly lazyObserver = new LazyRenderObserver();

    /** The scrolling container of the card list; it is the root of `lazyObserver` */
    private readonly containerRef = React.createRef<HTMLDivElement>();

    /** A load is running. A second one must not tear down the same list in parallel */
    private loadingDevices = false;

    /** A load was requested while another one was still running */
    private reloadRequested = false;

    /** Devices of the running initial load that are not published to the state yet */
    private pendingDevices: DeviceInfo[] | null = null;

    private pendingTotal: number | undefined;

    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    /** Memoized result of `getHiddenIndicators`, so that all cards keep getting the same array */
    private hiddenIndicatorsCache: { key: string; value: string[] } | null = null;

    constructor(props: DeviceListProps) {
        super(props);

        this.stateOrObjectHandler = new StateOrObjectHandler(this.props.socket);
        this.fieldsResolver = new DeviceFieldsResolver(this.stateOrObjectHandler, this.onFieldsChanged);

        if (!DeviceList.i18nInitialized) {
            DeviceList.i18nInitialized = true;
            I18n.extendTranslations({
                en,
                de,
                ru,
                pt,
                nl,
                fr,
                it,
                es,
                pl,
                uk,
                'zh-cn': zhCn,
            });
        }

        this.state = {
            ...this.state,
            devices: [],
            filter: '',
            filterText: '',
            instanceInfo: null,
            loading: null,
            alive: null,
            groupKey: '',
            dmInstances: null,
            apiVersionError: false,
            onlyUpdatable: window.localStorage.getItem('dm_onlyUpdatable') === 'true',
            onlyBatteryProblem: window.localStorage.getItem('dm_onlyBatteryProblem') === 'true',
            filterField: (window.localStorage.getItem('dm_filterField') as DeviceFilterField) || 'name',
            modelOptions: [],
            indicatorVisibility: {},
            indicatorsAnchor: null,
            fieldsVersion: 0,
        };

        if (this.props.selectedInstance === undefined) {
            // Start with the root page that shows all instances as cards
            this.state = { ...this.state, selectedInstance: this.props.instance ?? '' };
        }

        this.state = {
            ...this.state,
            indicatorVisibility: DeviceList.loadIndicatorVisibility(this.state.selectedInstance),
        };

        this.lastInstance = this.state.selectedInstance;
        this.lastTriggerLoad = this.props.triggerLoad || 0;
    }

    setStateAsync(state: Partial<DeviceListState>): Promise<void> {
        return new Promise<void>(resolve => this.setState(state as DeviceListState, resolve));
    }

    private async loadAdapters(): Promise<void> {
        await this.props.socket.waitForFirstConnection();

        console.log('Loading adapters...');
        const res = await this.props.socket.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.\u9999');
        const dmInstances: { [instanceName: string]: { title: string; icon: string; instance: number } } = {};
        for (const id in res) {
            if (!res[id].common.supportedMessages?.deviceManager) {
                continue;
            }

            const instanceName = id.substring('system.adapter.'.length);
            try {
                // Check if the instance is alive by getting the state alive
                const alive = await this.props.socket.getState(`system.adapter.${instanceName}.alive`);
                if (!alive?.val) {
                    continue;
                }

                const instance = parseInt(instanceName.split('.').pop() || '0') || 0;
                const common = res[id].common;
                const adapterName = instanceName.split('.')[0];
                dmInstances[instanceName] = {
                    title: common.titleLang ? this.getText(common.titleLang) : common.title || adapterName,
                    icon: common.icon ? `./adapter/${adapterName}/${common.icon}` : common.extIcon || '',
                    instance,
                };
            } catch (error) {
                console.error(error);
            }
        }

        if (Object.keys(dmInstances).length === 1) {
            // With only one instance, select it directly and do not show the root page
            const selectedInstance = Object.keys(dmInstances)[0];
            await this.setStateAsync({
                dmInstances,
                selectedInstance,
                groupKey: window.localStorage.getItem(`dm_group_${selectedInstance}`) || '',
            });
        } else {
            await this.setStateAsync({ dmInstances });
        }
    }

    private selectInstance(instanceId: string): void {
        window.localStorage.setItem('dmSelectedInstance', instanceId);
        this.props.onInstanceChanged?.(instanceId);
        this.setState({
            selectedInstance: instanceId,
            groupKey: window.localStorage.getItem(`dm_group_${instanceId}`) || '',
        });
    }

    private backToInstancesList(): void {
        window.localStorage.removeItem('dmSelectedInstance');
        this.props.onInstanceChanged?.('');
        this.alive = null;
        this.applyDevices([], {
            selectedInstance: '',
            totalDevices: undefined,
            instanceInfo: null,
            alive: null,
            groupKey: '',
            filter: '',
            filterText: '',
            apiVersionError: false,
        });
    }

    private refreshInstanceList(): void {
        this.setState({ dmInstances: null }, () => this.loadAdapters().catch(console.error));
    }

    async componentDidMount(): Promise<void> {
        this.lazyObserver.setRoot(this.containerRef.current);

        let alive = false;
        // If an instance selector must be shown
        if (this.props.selectedInstance === undefined) {
            // show instance selector
            await this.loadAdapters();
        }

        if (this.alive === null && this.state.selectedInstance) {
            try {
                // check if the instance is alive
                const stateAlive = await this.props.socket.getState(
                    `system.adapter.${this.state.selectedInstance}.alive`,
                );
                if (stateAlive?.val) {
                    alive = true;
                }
            } catch (error) {
                console.error(error);
            }
            // Update the synchronous mirror BEFORE subscribing. `subscribeState` replays the current
            // value to `aliveHandler`; with `this.alive` already set, that replay is recognized as
            // "no change" and does not trigger a second `loadAllData()` in addition to the one below.
            this.alive = alive;
            this.lastAliveSubscribe = this.state.selectedInstance;
            this.setState({ alive });
            await this.props.socket.subscribeState(
                `system.adapter.${this.state.selectedInstance}.alive`,
                this.aliveHandler,
            );
        } else if (this.alive !== null) {
            alive = this.alive;
        }

        if (alive) {
            try {
                await this.loadAllData();
            } catch (error) {
                console.error(error);
            }
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.cancelDeviceFlush();
        this.fieldsResolver.destroy();
        this.stateOrObjectHandler.destroy();
        this.lazyObserver.destroy();
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
            this.filterTimeout = null;
        }
        if (this.state.selectedInstance) {
            this.props.socket.unsubscribeState(
                `system.adapter.${this.state.selectedInstance}.alive`,
                this.aliveHandler,
            );
        }
    }

    /**
     * The side effects that used to be triggered from `render()`. A render must not have any, and
     * the `setTimeout` there was executed on every single render.
     */
    componentDidUpdate(): void {
        // The scrolling container only exists after the first render
        this.lazyObserver.setRoot(this.containerRef.current);

        if ((this.props.triggerLoad || 0) !== this.lastTriggerLoad) {
            this.lastTriggerLoad = this.props.triggerLoad || 0;
            this.loadDeviceList();
        }

        // if instance changed
        if (this.lastInstance !== this.state.selectedInstance) {
            this.lastInstance = this.state.selectedInstance;
            // The indicator visibility is stored per instance
            this.setState({
                indicatorVisibility: DeviceList.loadIndicatorVisibility(this.state.selectedInstance),
                indicatorsAnchor: null,
            });
            if (this.state.selectedInstance) {
                this.loadAllData().catch(error => console.error(error));
            } else {
                this.loadDeviceList();
            }
        }

        if (this.props.selectedInstance && this.props.selectedInstance !== this.state.selectedInstance) {
            this.setState({ selectedInstance: this.props.selectedInstance });
        }
    }

    /**
     * A value bound to a state or an object arrived. The cards are `PureComponent`s and receive the
     * values through their `fields` property, so the list only has to trigger a re-render.
     */
    private onFieldsChanged = (): void => {
        const modelOptions = this.fieldsResolver.getModels();
        const modelsChanged =
            modelOptions.length !== this.state.modelOptions.length ||
            modelOptions.some((model, i) => model !== this.state.modelOptions[i]);

        this.setState({
            fieldsVersion: this.state.fieldsVersion + 1,
            modelOptions: modelsChanged ? modelOptions : this.state.modelOptions,
        });
    };

    /**
     * Publish a new device list.
     *
     * The resolver is updated *before* the state, because it resolves literal values synchronously -
     * the cards and the filter therefore already have their values on the very first render.
     */
    private applyDevices(devices: DeviceInfo[], state: Partial<DeviceListState>): void {
        this.fieldsResolver.setDevices(devices.map(device => ({ key: deviceKey(device), device })));
        this.setState({ ...state, devices } as DeviceListState);
    }

    /**
     * Publish the devices loaded so far, but at most every 100 ms: a fast backend delivers a dozen
     * batches in a row, and every single one of them would otherwise re-render the complete list.
     */
    private scheduleDeviceFlush(devices: DeviceInfo[], total?: number): void {
        this.pendingDevices = devices;
        this.pendingTotal = total;
        if (this.flushTimer) {
            return;
        }
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            const pending = this.pendingDevices;
            if (pending) {
                this.pendingDevices = null;
                this.applyDevices(pending, { loading: true, totalDevices: this.pendingTotal });
            }
        }, 100);
    }

    private cancelDeviceFlush(): void {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        this.pendingDevices = null;
    }

    aliveHandler: ioBroker.StateChangeHandler = (id: string, state: ioBroker.State | null | undefined): void => {
        if (this.state.selectedInstance && id === `system.adapter.${this.state.selectedInstance}.alive`) {
            const alive = !!state?.val;
            // Compare against the synchronous mirror, not `state.alive` (which may not be committed yet
            // when `subscribeState` replays the initial value). This is what stops the double load.
            if (alive !== this.alive) {
                this.alive = alive;
                this.setState({ alive }, () => {
                    if (alive) {
                        // The instance just became alive: (re)load all data directly instead of
                        // re-running the whole mount logic.
                        this.loadAllData().catch(console.error);
                    }
                });
            }
        }
    };

    override async loadAllData(): Promise<void> {
        await this.loadInstanceInfos();
        this.loadDeviceList();
    }

    override async loadInstanceInfos(): Promise<InstanceDetails> {
        const instanceInfo = await super.loadInstanceInfos();
        return new Promise<InstanceDetails>(resolve =>
            this.setState(
                { instanceInfo, apiVersionError: !['v1', 'v2', 'v3'].includes(instanceInfo.apiVersion) },
                () => resolve(instanceInfo),
            ),
        );
    }

    /**
     * Load devices.
     *
     * The list is deliberately *not* emptied first: as long as the keys stay the same React keeps the
     * existing cards, so a reload - the matter adapter triggers one on every `updateController`
     * message - no longer unmounts and remounts a few hundred cards with all their subscriptions.
     */
    override loadDeviceList(): void {
        if (this.loadingDevices) {
            // Remember the request and repeat the load once the running one has finished, instead of
            // running two loads over the same list at the same time.
            this.reloadRequested = true;
            return;
        }
        this.loadingDevices = true;

        this.setState({ loading: true }, async () => {
            console.log(`Loading devices for ${this.state.selectedInstance}...`);
            let alive = this.alive;

            if (this.state.selectedInstance !== this.lastAliveSubscribe) {
                if (this.lastAliveSubscribe) {
                    // unsubscribe from the old instance
                    this.props.socket.unsubscribeState(
                        `system.adapter.${this.lastAliveSubscribe}.alive`,
                        this.aliveHandler,
                    );
                }

                this.lastAliveSubscribe = this.state.selectedInstance;

                if (this.state.selectedInstance) {
                    try {
                        // check if the instance is alive
                        const stateAlive = await this.props.socket.getState(
                            `system.adapter.${this.state.selectedInstance}.alive`,
                        );
                        alive = !!stateAlive?.val;
                    } catch (error) {
                        console.error(error);
                        alive = false;
                    }
                    // Set the synchronous mirror before subscribing so the replayed initial value
                    // does not trigger an extra load on top of the one performed right below.
                    this.alive = alive;
                    await this.props.socket.subscribeState(
                        `system.adapter.${this.state.selectedInstance}.alive`,
                        this.aliveHandler,
                    );
                } else {
                    alive = false;
                }
            }

            // Only the very first load shows the devices step by step (with skeletons for the ones
            // that are still missing). A reload keeps the current list until the new one is complete,
            // so the already rendered cards survive.
            const incremental = !this.state.devices.length;
            let devices: DeviceInfo[] = [];
            try {
                this.alive = alive;
                this.setState({ loading: !!alive, alive });
                if (alive) {
                    await this.loadDevices((batch, total) => {
                        devices = devices.concat(batch);
                        if (incremental) {
                            this.scheduleDeviceFlush(devices, total);
                        }
                        console.log(`Loaded ${devices.length} of ${total} devices...`);
                    });
                }
            } catch (error) {
                console.error(error);
                devices = [];
            }

            this.cancelDeviceFlush();
            this.applyDevices(devices, { loading: false, totalDevices: devices.length });
            console.log(`Loaded ${devices.length} devices for ${this.state.selectedInstance}`);

            this.loadingDevices = false;
            if (this.reloadRequested) {
                this.reloadRequested = false;
                setTimeout(() => this.loadDeviceList(), 0);
            }
        });
    }

    override updateDevice(update: DeviceInfo): void {
        const updateId = JSON.stringify(update.id);
        this.applyDevices(
            this.state.devices.map(d => (deviceKey(d) === updateId ? update : d)),
            {},
        );
    }

    override deleteDevice(deviceId: DeviceId): void {
        const deleteId = JSON.stringify(deviceId);
        const devices = this.state.devices.filter(d => deviceKey(d) !== deleteId);
        const totalDevices =
            this.state.totalDevices && devices.length < this.state.devices.length
                ? this.state.totalDevices - 1
                : undefined;
        this.applyDevices(devices, { totalDevices });
    }

    getText(text: ioBroker.StringOrTranslated): string {
        if (typeof text === 'object') {
            return text[this.language] || text.en;
        }

        return text;
    }

    handleFilterChange(filter: string): void {
        this.setState({ filterText: filter });
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(() => {
            this.filterTimeout = null;
            this.setState({ filter });
        }, 250);
    }

    renderGroups(
        groups: { name: string; value: string; count: number; icon?: React.JSX.Element | string | null }[] | undefined,
    ): React.JSX.Element | null {
        if (!groups?.length) {
            return null;
        }

        return (
            <Select
                style={{ minWidth: 120, marginRight: 8, flexShrink: 0 }}
                variant="standard"
                value={this.state.groupKey || '_'}
                renderValue={value => {
                    if (value === '_') {
                        value = '';
                    }
                    const g = groups.find(g => g.value === value);
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {g?.icon || <div style={{ width: 24 }} />}
                            {g?.name || value}
                        </div>
                    );
                }}
                onChange={e => {
                    if (e.target.value) {
                        window.localStorage.setItem(`dm_group_${this.state.selectedInstance}`, e.target.value);
                    } else {
                        window.localStorage.removeItem(`dm_group_${this.state.selectedInstance}`);
                    }
                    this.setState({ groupKey: e.target.value === '_' ? '' : e.target.value });
                }}
            >
                {groups.map(g => (
                    <MenuItem
                        value={g.value || '_'}
                        key={g.value || '_'}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        {g.icon || <div style={{ width: 24 }} />}
                        {g.name}
                    </MenuItem>
                ))}
            </Select>
        );
    }

    renderInstanceCards(): React.JSX.Element[] {
        if (!this.state.dmInstances) {
            return [
                <LinearProgress
                    key="loadingInstances"
                    style={{ width: '100%' }}
                />,
            ];
        }

        const instanceIds = Object.keys(this.state.dmInstances);
        if (!instanceIds.length) {
            return [
                <div
                    style={{ padding: 25 }}
                    key="noInstances"
                >
                    <span>{getTranslation('noInstancesFoundText')}</span>
                </div>,
            ];
        }

        const backgroundColor = this.props.theme.palette.mode === 'dark' ? '#0b0b0b' : '#d5d5d5';

        if (this.props.smallCards) {
            return instanceIds.map(id => {
                const info = this.state.dmInstances![id];
                return (
                    <Card
                        key={id}
                        sx={{ width: 200, margin: '5px', backgroundColor }}
                    >
                        <CardActionArea
                            onClick={() => this.selectInstance(id)}
                            style={{ height: '100%' }}
                        >
                            <CardContent
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: 8,
                                }}
                            >
                                {info.icon ? (
                                    <Icon
                                        src={info.icon}
                                        style={{ width: 32, height: 32, flexShrink: 0 }}
                                    />
                                ) : (
                                    <QuestionMark style={{ width: 32, height: 32, flexShrink: 0 }} />
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                    <Typography
                                        variant="body1"
                                        noWrap
                                        style={{ fontSize: 14, fontWeight: 'bold' }}
                                    >
                                        {id}
                                    </Typography>
                                    {info.title ? (
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            noWrap
                                            component="div"
                                        >
                                            {info.title}
                                        </Typography>
                                    ) : null}
                                </div>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                );
            });
        }

        return instanceIds.map(id => {
            const info = this.state.dmInstances![id];
            return (
                <Card
                    key={id}
                    sx={{ width: 240, margin: '10px', backgroundColor }}
                >
                    <CardActionArea
                        onClick={() => this.selectInstance(id)}
                        style={{ height: '100%' }}
                    >
                        <CardContent
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {info.icon ? (
                                <Icon
                                    src={info.icon}
                                    style={{ width: 64, height: 64 }}
                                />
                            ) : (
                                <QuestionMark style={{ width: 64, height: 64 }} />
                            )}
                            <Typography
                                variant="h6"
                                style={{ textAlign: 'center', wordBreak: 'break-all' }}
                            >
                                {id}
                            </Typography>
                            {info.title ? (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    style={{ textAlign: 'center' }}
                                >
                                    {info.title}
                                </Typography>
                            ) : null}
                        </CardContent>
                    </CardActionArea>
                </Card>
            );
        });
    }

    /**
     * Apply the text filter and the "only updatable" / "only battery problem" filters.
     *
     * This used to be done by every card for itself. A filtered out card stayed mounted with all its
     * subscriptions and only rendered nothing, so filtering did not reduce the load at all - and a
     * card that is not rendered cannot filter itself in the first place.
     */
    private filterDevices(devices: DeviceInfo[]): DeviceInfo[] {
        const filter = (this.props.embedded ? this.props.filter : this.state.filter)?.toLowerCase();
        const field: DeviceFilterField = this.props.embedded ? 'name' : this.getEffectiveFilterField();
        const onlyUpdatable = !this.props.embedded && this.state.onlyUpdatable;
        const onlyBatteryProblem = !this.props.embedded && this.state.onlyBatteryProblem;

        if (!filter && !onlyUpdatable && !onlyBatteryProblem) {
            return devices;
        }

        return devices.filter(device => {
            const fields = this.fieldsResolver.getValues(deviceKey(device));
            if (
                filter &&
                !String(fields[field] ?? '')
                    .toLowerCase()
                    .includes(filter)
            ) {
                return false;
            }
            if (onlyUpdatable && !fields.updateAvailable) {
                return false;
            }
            if (onlyBatteryProblem && !fields.batteryProblem) {
                return false;
            }
            return true;
        });
    }

    /** The selected filter field, falling back to `name` if the stored field is not available (e.g. no models found) */
    private getEffectiveFilterField(): DeviceFilterField {
        const field = this.state.filterField;
        if (field === 'name') {
            return 'name';
        }
        // The model field is only available if at least one model value was actually found
        if (field === 'model') {
            return this.state.modelOptions.length ? 'model' : 'name';
        }
        return this.state.devices.some(device => device[field] !== undefined) ? field : 'name';
    }

    renderFilterFields(): React.JSX.Element | null {
        const fields: { value: DeviceFilterField; label: string }[] = [
            { value: 'name', label: getTranslation('name') },
        ];
        if (this.state.devices.some(device => device.identifier !== undefined)) {
            fields.push({
                value: 'identifier',
                label: this.getText(this.state.instanceInfo?.identifierLabel ?? 'ID'),
            });
        }
        if (this.state.devices.some(device => device.manufacturer !== undefined)) {
            fields.push({ value: 'manufacturer', label: getTranslation('manufacturer') });
        }
        // Only offer the model filter if at least one model value was actually found
        if (this.state.modelOptions.length) {
            fields.push({ value: 'model', label: getTranslation('model') });
        }

        // Only show the field selector when there is more than just the name to choose from
        if (fields.length < 2) {
            return null;
        }

        const current = this.getEffectiveFilterField();

        return (
            <Select
                variant="standard"
                style={{ width: 130, flexShrink: 0 }}
                value={current}
                onChange={e => {
                    const filterField = e.target.value;
                    this.setState({ filterField });
                    window.localStorage.setItem('dm_filterField', filterField);
                    // reset the current filter value when switching the field
                    this.handleFilterChange('');
                }}
            >
                {fields.map(field => (
                    <MenuItem
                        value={field.value}
                        key={field.value}
                    >
                        {field.label}
                    </MenuItem>
                ))}
            </Select>
        );
    }

    /** The filter value input: a model dropdown for the `model` field, a free-text field otherwise */
    renderFilterValue(): React.JSX.Element {
        if (this.getEffectiveFilterField() === 'model') {
            const value = this.state.modelOptions.includes(this.state.filterText) ? this.state.filterText : '';
            return (
                <Select
                    variant="standard"
                    style={{ width: 200 }}
                    displayEmpty
                    value={value}
                    onChange={e => this.handleFilterChange(e.target.value)}
                >
                    <MenuItem value="">
                        <em>{getTranslation('allModels')}</em>
                    </MenuItem>
                    {this.state.modelOptions.map(model => (
                        <MenuItem
                            value={model}
                            key={model}
                        >
                            {model}
                        </MenuItem>
                    ))}
                </Select>
            );
        }

        return (
            <TextField
                variant="standard"
                style={{ width: 200 }}
                size="small"
                placeholder={getTranslation('filterLabelText')}
                onChange={e => this.handleFilterChange(e.target.value)}
                value={this.state.filterText}
                autoComplete="off"
                slotProps={{
                    input: {
                        autoComplete: 'new-password',
                        endAdornment: this.state.filterText ? (
                            <InputAdornment position="end">
                                <IconButton
                                    tabIndex={-1}
                                    onClick={() => this.handleFilterChange('')}
                                    edge="end"
                                >
                                    <Clear />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    },
                    htmlInput: {
                        autoComplete: 'off',
                    },
                }}
            />
        );
    }

    renderRootInfo(): React.JSX.Element {
        // The root ThemeProvider (Communication.render) already supplies the correct theme context. The explicit color
        // is a safety net, so older InfoBox versions (whose Typography has no own color) stay readable in dark mode.
        return (
            <InfoBox
                key="rootInfo"
                type="info"
                closeable
                storeId="dm_rootInfoClosed"
                style={{
                    width: 'calc(100% - 20px)',
                    margin: '0 10px 8px 10px',
                    color: this.props.theme.palette.text.primary,
                }}
            >
                {I18n.t('rootInfoText')}
            </InfoBox>
        );
    }

    /** Key of the stored indicator visibility of one instance */
    private static indicatorStorageKey(instanceId: string): string {
        return `dm_indicators_${instanceId}`;
    }

    /** Read the visibility the user has explicitly chosen for the configurable indicators of an instance */
    private static loadIndicatorVisibility(instanceId: string): Record<string, boolean> {
        if (!instanceId) {
            return {};
        }
        try {
            const stored = window.localStorage.getItem(DeviceList.indicatorStorageKey(instanceId));
            return stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
        } catch (error) {
            console.error(error);
            return {};
        }
    }

    /**
     * All configurable indicators of the instance and of the loaded devices, unique by ID.
     * Indicators with the same ID on different devices are configured together.
     */
    private getConfigurableIndicators(): StatusIndicator[] {
        const result: StatusIndicator[] = [];
        const seen = new Set<string>();

        const collect = (indicators?: StatusIndicator[]): void => {
            for (const indicator of indicators || []) {
                if (indicator.configurable && !seen.has(indicator.id)) {
                    seen.add(indicator.id);
                    result.push(indicator);
                }
            }
        };

        collect(this.state.instanceInfo?.indicators);
        for (const device of this.state.devices) {
            collect(device.indicators);
        }

        return result;
    }

    /** True if the given configurable indicator is currently shown */
    private isIndicatorVisible(indicator: StatusIndicator): boolean {
        if (!indicator.configurable) {
            return true;
        }
        return this.state.indicatorVisibility[indicator.id] ?? indicator.defaultVisible !== false;
    }

    /** IDs of the configurable indicators the user has switched off */
    private getHiddenIndicators(): string[] {
        const hidden = this.getConfigurableIndicators()
            .filter(indicator => !this.isIndicatorVisible(indicator))
            .map(indicator => indicator.id);

        // The array is handed to every card. A new array on every render would defeat the shallow
        // property comparison of `DeviceCard`.
        const key = hidden.join(',');
        if (!this.hiddenIndicatorsCache || this.hiddenIndicatorsCache.key !== key) {
            this.hiddenIndicatorsCache = { key, value: hidden };
        }
        return this.hiddenIndicatorsCache.value;
    }

    private toggleIndicator(indicator: StatusIndicator): void {
        const indicatorVisibility = {
            ...this.state.indicatorVisibility,
            [indicator.id]: !this.isIndicatorVisible(indicator),
        };
        this.setState({ indicatorVisibility });
        window.localStorage.setItem(
            DeviceList.indicatorStorageKey(this.state.selectedInstance),
            JSON.stringify(indicatorVisibility),
        );
    }

    /** The toolbar button that lets the user show or hide the configurable indicators */
    renderIndicatorSettings(): JSX.Element | null {
        const configurable = this.getConfigurableIndicators();
        if (!configurable.length) {
            return null;
        }

        return (
            <>
                <Tooltip
                    title={getTranslation('indicatorsTooltip')}
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <IconButton
                        size="small"
                        onClick={e => this.setState({ indicatorsAnchor: e.currentTarget })}
                    >
                        <Tune />
                    </IconButton>
                </Tooltip>
                <Menu
                    open={!!this.state.indicatorsAnchor}
                    anchorEl={this.state.indicatorsAnchor}
                    onClose={() => this.setState({ indicatorsAnchor: null })}
                >
                    <ListSubheader style={{ lineHeight: '32px' }}>{getTranslation('indicatorsTitle')}</ListSubheader>
                    {configurable.map(indicator => (
                        <MenuItem
                            key={indicator.id}
                            onClick={() => this.toggleIndicator(indicator)}
                        >
                            <Checkbox
                                edge="start"
                                size="small"
                                checked={this.isIndicatorVisible(indicator)}
                            />
                            {/* Only a literal icon can be shown here, a state-bound one has no value without a device */}
                            {typeof indicator.icon === 'string' ? (
                                <span style={{ display: 'inline-flex', marginRight: 8 }}>
                                    {renderIcon(indicator.icon, undefined, true)}
                                </span>
                            ) : null}
                            {this.getText(indicator.label || indicator.tooltip || indicator.id)}
                        </MenuItem>
                    ))}
                </Menu>
            </>
        );
    }

    /** Resolve how an instance indicator behaves on click by looking up the referenced instance action */
    private resolveInstanceIndicatorAction = (
        actionId: string,
    ): { onClick?: () => void; url?: string; disabled?: boolean } | undefined => {
        const action = this.state.instanceInfo?.actions?.find(a => a.id === actionId);
        if (!action) {
            console.warn(
                `Indicator of instance ${this.state.selectedInstance} references unknown action "${actionId}"`,
            );
            return undefined;
        }

        if ('url' in action && action.url) {
            return { url: getTranslation(action.url), disabled: action.disabled };
        }

        return { onClick: this.instanceHandler(action), disabled: action.disabled };
    };

    /** Instance actions in the toolbar. An action referenced by an indicator is not rendered twice */
    renderInstanceActions(): JSX.Element | null {
        const referenced = new Set(
            (this.state.instanceInfo?.indicators || [])
                .map(indicator => indicator.actionId)
                .filter((actionId): actionId is string => !!actionId),
        );
        const actions = this.state.instanceInfo?.actions?.filter(action => !referenced.has(action.id));

        if (!actions?.length) {
            return null;
        }

        return (
            <div style={{ marginLeft: 20 }}>
                {actions.map(action => (
                    <InstanceActionButton
                        key={action.id}
                        action={action}
                        instanceHandler={this.instanceHandler}
                    />
                ))}
            </div>
        );
    }

    renderContent(): JSX.Element | JSX.Element[] | null {
        const emptyStyle: React.CSSProperties = {
            padding: 25,
        };

        const deviceGroups: { name: string; value: string; count: number; icon?: React.JSX.Element | string | null }[] =
            [];
        const showRootPage =
            !this.props.embedded && this.props.selectedInstance === undefined && !this.state.selectedInstance;

        let list: React.JSX.Element[] | undefined;
        if (showRootPage) {
            list = this.renderInstanceCards();
            list.unshift(this.renderRootInfo());
        } else if (!this.props.embedded && !this.state.alive) {
            list = [
                <div
                    style={emptyStyle}
                    key="notAlive"
                >
                    <span>{getTranslation('instanceNotAlive')}</span>
                </div>,
            ];
        } else if (!this.state.devices.length && this.state.selectedInstance && !this.state.loading) {
            list = [
                <div
                    style={emptyStyle}
                    key="notFound"
                >
                    <span>{getTranslation('noDevicesFoundText')}</span>
                </div>,
            ];
        } else {
            // build a device types list
            let filteredDevices = this.state.devices;
            if (!this.state.loading && !this.props.embedded && filteredDevices.find(device => device.group)) {
                deviceGroups.push({
                    name: I18n.t('All'),
                    value: '',
                    count: filteredDevices.length,
                    icon: <FilterAltOff />,
                });
                filteredDevices.forEach(device => {
                    if (device.group) {
                        const type = deviceGroups.find(t => t.value === device.group?.key);
                        if (type) {
                            type.count++;
                        } else {
                            const icon = device.group.icon ? <DeviceTypeIcon src={device.group.icon} /> : null;

                            deviceGroups.push({
                                name: this.getText(device.group.name || device.group.key),
                                value: device.group.key,
                                count: 1,
                                icon,
                            });
                        }
                    }
                });
                const unknown = filteredDevices.filter(device => !device.group);
                if (unknown.length) {
                    deviceGroups.push({
                        name: I18n.t('Unknown'),
                        value: '?',
                        count: unknown.length,
                        icon: <QuestionMark />,
                    });
                }

                if (this.state.groupKey && this.state.groupKey !== '_') {
                    // filter out all devices belonging to this group
                    if (this.state.groupKey === '?') {
                        filteredDevices = filteredDevices.filter(device => !device.group?.key);
                    } else {
                        filteredDevices = filteredDevices.filter(device => device.group?.key === this.state.groupKey);
                    }
                }
            }

            if (this.state.selectedInstance) {
                const selectedInstance = this.state.selectedInstance;
                const hiddenIndicators = this.getHiddenIndicators();
                const smallCards = this.props.smallCards ?? this.state.instanceInfo?.smallCards;
                const identifierLabel = this.state.instanceInfo?.identifierLabel ?? 'ID';
                const cardWidth = smallCards ? SMALL_CARD_WIDTH : CARD_WIDTH;
                const cardMinHeight = smallCards ? SMALL_CARD_MIN_HEIGHT : CARD_MIN_HEIGHT;
                const cardMargin = smallCards ? SMALL_CARD_MARGIN : CARD_MARGIN;
                const visibleDevices = this.filterDevices(filteredDevices);

                // Every card is wrapped in a `LazyRender`: the placeholder always occupies the full
                // footprint of a card, but the card itself is only built while it is near the visible
                // area. Without that, 80 devices mean thousands of DOM nodes and several hundred MUI
                // tooltips and buttons at once - which is what makes Safari (and especially iPadOS)
                // hang and finally kill the tab.
                list = visibleDevices.map(device => {
                    const key = deviceKey(device);
                    return (
                        <LazyRender
                            key={key}
                            observer={this.lazyObserver}
                            width={cardWidth}
                            minHeight={cardMinHeight}
                            margin={cardMargin}
                        >
                            {() => (
                                <DeviceCard
                                    fillContainer
                                    smallCards={smallCards}
                                    alive={!!this.state.alive}
                                    id={device.id}
                                    identifierLabel={identifierLabel}
                                    device={device}
                                    fields={this.fieldsResolver.getValues(key)}
                                    stateOrObjectHandler={this.stateOrObjectHandler}
                                    instanceId={selectedInstance}
                                    uploadImagesToInstance={this.props.uploadImagesToInstance}
                                    deviceHandler={this.deviceHandler}
                                    controlHandler={this.controlHandler}
                                    controlStateHandler={this.controlStateHandler}
                                    socket={this.props.socket}
                                    themeName={this.props.themeName}
                                    themeType={this.props.themeType}
                                    theme={this.props.theme}
                                    isFloatComma={this.props.isFloatComma}
                                    dateFormat={this.props.dateFormat}
                                    hiddenIndicators={hiddenIndicators}
                                />
                            )}
                        </LazyRender>
                    );
                });

                if (this.state.loading) {
                    // How many devices are still missing - deliberately not derived from `list`,
                    // which only contains the devices that pass the filter
                    const loaded = this.state.devices.length;
                    const missing = (this.state.totalDevices ?? loaded + 1) - loaded;
                    const skeletons = Math.min(missing, MAX_SKELETONS);
                    for (let i = 0; i < skeletons; i++) {
                        list.push(
                            <DeviceCardSkeleton
                                key={`skeleton-${i}`}
                                smallCards={smallCards}
                                theme={this.props.theme}
                            />,
                        );
                    }
                } else if (!visibleDevices.length && this.state.devices.length > 0) {
                    // The filter is applied here now, so the list knows that nothing is left instead
                    // of having to hide the message with a CSS rule
                    list.push(
                        <div
                            style={emptyStyle}
                            key="filtered"
                        >
                            <span>{getTranslation('allDevicesFilteredOut')}</span>
                        </div>,
                    );
                }
            } else {
                list = [
                    <div
                        style={emptyStyle}
                        key="selectInstance"
                    >
                        <span>{getTranslation('selectInstanceText')}</span>
                    </div>,
                ];
            }
        }

        if (this.props.embedded) {
            return (
                <>
                    {this.state.loading ? <LinearProgress style={{ width: '100%' }} /> : null}
                    {this.state.apiVersionError ? <div>{I18n.t('apiVersionError')}</div> : list}
                </>
            );
        }

        return (
            <div
                style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <Toolbar
                    variant="dense"
                    style={{
                        backgroundColor: '#777',
                        display: 'flex',
                        flexWrap: 'wrap',
                        rowGap: 4,
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    {this.props.title}
                    {this.props.selectedInstance === undefined &&
                    this.state.dmInstances &&
                    this.state.selectedInstance ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {Object.keys(this.state.dmInstances).length > 1 ? (
                                <Tooltip
                                    title={getTranslation('backToInstancesList')}
                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                >
                                    <IconButton
                                        onClick={() => this.backToInstancesList()}
                                        size="small"
                                    >
                                        <ArrowBack />
                                    </IconButton>
                                </Tooltip>
                            ) : null}
                            {this.state.dmInstances[this.state.selectedInstance]?.icon ? (
                                <Icon
                                    src={this.state.dmInstances[this.state.selectedInstance].icon}
                                    style={{ width: 24, height: 24 }}
                                />
                            ) : null}
                            <span style={{ marginRight: 8 }}>{this.state.selectedInstance}</span>
                        </div>
                    ) : null}
                    {this.props.selectedInstance === undefined && !this.state.selectedInstance ? (
                        <Tooltip
                            title={getTranslation('refreshInstanceList')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <span>
                                <IconButton
                                    onClick={() => this.refreshInstanceList()}
                                    disabled={!this.state.dmInstances}
                                    size="small"
                                >
                                    <Refresh />
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                    {this.state.selectedInstance ? (
                        <Tooltip
                            title={getTranslation('refreshTooltip')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <span>
                                <IconButton
                                    onClick={() => this.loadAllData()}
                                    disabled={!this.state.alive || this.state.apiVersionError}
                                    size="small"
                                >
                                    <Refresh />
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                    {!this.state.apiVersionError && this.state.alive && this.renderInstanceActions()}
                    {!this.state.apiVersionError && this.state.alive && this.state.instanceInfo?.indicators?.length ? (
                        <StatusIndicators
                            indicators={this.state.instanceInfo.indicators.filter(indicator =>
                                this.isIndicatorVisible(indicator),
                            )}
                            theme={this.props.theme}
                            stateOrObjectHandler={this.stateOrObjectHandler}
                            resolveAction={this.resolveInstanceIndicatorAction}
                            defaultColor="#fff"
                            style={{ marginLeft: 20 }}
                        />
                    ) : null}

                    <div style={{ flexGrow: 1 }} />

                    {!this.state.apiVersionError && this.renderGroups(deviceGroups)}
                    {!this.state.apiVersionError &&
                    this.state.alive &&
                    this.state.devices.some(device => device.update) ? (
                        <Tooltip
                            title={getTranslation('onlyUpdatableTooltip')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <IconButton
                                color={this.state.onlyUpdatable ? 'primary' : 'default'}
                                onClick={() => {
                                    const onlyUpdatable = !this.state.onlyUpdatable;
                                    this.setState({ onlyUpdatable });
                                    window.localStorage.setItem('dm_onlyUpdatable', onlyUpdatable ? 'true' : 'false');
                                }}
                                size="small"
                            >
                                <SystemUpdateAlt />
                            </IconButton>
                        </Tooltip>
                    ) : null}
                    {!this.state.apiVersionError &&
                    this.state.alive &&
                    this.state.devices.some(device => hasBatteryStatus(device.status)) ? (
                        <Tooltip
                            title={getTranslation('onlyBatteryProblemTooltip')}
                            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                        >
                            <IconButton
                                color={this.state.onlyBatteryProblem ? 'primary' : 'default'}
                                onClick={() => {
                                    const onlyBatteryProblem = !this.state.onlyBatteryProblem;
                                    this.setState({ onlyBatteryProblem });
                                    window.localStorage.setItem(
                                        'dm_onlyBatteryProblem',
                                        onlyBatteryProblem ? 'true' : 'false',
                                    );
                                }}
                                size="small"
                            >
                                <BatteryAlert />
                            </IconButton>
                        </Tooltip>
                    ) : null}
                    {!this.state.apiVersionError && this.state.alive ? this.renderIndicatorSettings() : null}
                    {!this.state.apiVersionError && this.state.alive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <FilterAlt style={{ color: '#fff' }} />
                            {this.renderFilterFields()}
                            {this.renderFilterValue()}
                        </div>
                    ) : null}
                    <Typography
                        sx={{ display: { xs: 'none', md: 'block' } }}
                        style={{
                            marginLeft: 16,
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            color: '#fff',
                        }}
                    >
                        Config-Manager
                    </Typography>
                </Toolbar>
                <div
                    ref={this.containerRef}
                    style={{
                        width: '100%',
                        flex: 1,
                        minHeight: 0,
                        marginTop: 8,
                        overflow: 'auto',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'stretch',
                        alignContent: 'flex-start',
                        ...this.props.style,
                    }}
                >
                    {this.state.loading ? <LinearProgress style={{ width: '100%' }} /> : null}
                    {this.state.apiVersionError ? <div>{I18n.t('apiVersionError')}</div> : list}
                </div>
            </div>
        );
    }
}
