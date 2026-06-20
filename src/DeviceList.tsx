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
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
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
} from '@mui/icons-material';

import { I18n, DeviceTypeIcon, Icon, InfoBox } from '@iobroker/adapter-react-v5';
import type { DeviceId, DeviceInfo, DeviceStatus, InstanceDetails } from './protocol/api';

import DeviceCard, { DeviceCardSkeleton, type DeviceFilterField } from './DeviceCard';
import { getTranslation } from './Utils';
import Communication, { type CommunicationProps, type CommunicationState } from './Communication';
import InstanceActionButton from './InstanceActionButton';

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
}

/**
 * Device List Component
 */
export default class DeviceList extends Communication<DeviceListProps, DeviceListState> {
    static i18nInitialized = false;

    private lastInstance: string;

    private lastAliveSubscribe = '';

    private lastTriggerLoad = 0;

    private filterTimeout: ReturnType<typeof setTimeout> | null = null;

    /** Resolved model value per device (stringified id -> model), reported by the cards to build the model dropdown */
    private readonly modelValues = new Map<string, string>();

    private readonly language: ioBroker.Languages = I18n.getLanguage();

    constructor(props: DeviceListProps) {
        super(props);

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
        };

        if (this.props.selectedInstance === undefined) {
            // Start with the root page that shows all instances as cards
            this.state = { ...this.state, selectedInstance: '' };
        }

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
                selectedInstance: selectedInstance,
                groupKey: window.localStorage.getItem(`dm_group_${selectedInstance}`) || '',
            });
        } else {
            await this.setStateAsync({ dmInstances });
        }
    }

    private selectInstance(instanceId: string): void {
        window.localStorage.setItem('dmSelectedInstance', instanceId);
        this.setState({
            selectedInstance: instanceId,
            groupKey: window.localStorage.getItem(`dm_group_${instanceId}`) || '',
        });
    }

    private backToInstancesList(): void {
        window.localStorage.removeItem('dmSelectedInstance');
        this.setState({
            selectedInstance: '',
            devices: [],
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
        let alive = false;
        // If an instance selector must be shown
        if (this.props.selectedInstance === undefined) {
            // show instance selector
            await this.loadAdapters();
        }

        if (this.state.alive === null && this.state.selectedInstance) {
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
            this.lastAliveSubscribe = this.state.selectedInstance;
            this.setState({ alive }, () =>
                this.props.socket.subscribeState(
                    `system.adapter.${this.state.selectedInstance}.alive`,
                    this.aliveHandler,
                ),
            );
        } else if (this.state.alive !== null) {
            alive = this.state.alive;
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
        if (this.state.selectedInstance) {
            this.props.socket.unsubscribeState(
                `system.adapter.${this.state.selectedInstance}.alive`,
                this.aliveHandler,
            );
        }
    }

    aliveHandler: ioBroker.StateChangeHandler = (id: string, state: ioBroker.State | null | undefined): void => {
        if (this.state.selectedInstance && id === `system.adapter.${this.state.selectedInstance}.alive`) {
            const alive = !!state?.val;
            if (alive !== this.state.alive) {
                this.setState({ alive }, () => {
                    if (alive) {
                        this.componentDidMount().catch(console.error);
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
     * Load devices
     */
    override loadDeviceList(): void {
        this.setState({ loading: true }, async () => {
            console.log(`Loading devices for ${this.state.selectedInstance}...`);
            let alive = this.state.alive;

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
                        if (stateAlive?.val) {
                            alive = true;
                        }
                    } catch (error) {
                        console.error(error);
                    }
                    await this.props.socket.subscribeState(
                        `system.adapter.${this.state.selectedInstance}.alive`,
                        this.aliveHandler,
                    );
                } else {
                    alive = false;
                }
            }

            let devices: DeviceInfo[] = [];
            try {
                this.setState({ devices, loading: !!alive, alive });
                if (alive) {
                    await this.loadDevices((batch, total) => {
                        devices = devices.concat(batch);
                        this.setState({ devices, loading: true, totalDevices: total });
                        console.log(`Loaded ${devices.length} of ${total} devices...`);
                    });
                }
            } catch (error) {
                console.error(error);
                devices = [];
            }

            this.setState({ devices, loading: false, totalDevices: devices.length });
            console.log(`Loaded ${devices.length} devices for ${this.state.selectedInstance}`);
        });
    }

    override updateDevice(update: DeviceInfo): void {
        const updateId = JSON.stringify(update.id);
        this.setState({ devices: this.state.devices.map(d => (JSON.stringify(d.id) === updateId ? update : d)) });
    }

    override deleteDevice(deviceId: DeviceId): void {
        const deleteId = JSON.stringify(deviceId);
        const devices = this.state.devices.filter(d => JSON.stringify(d.id) !== deleteId);
        const totalDevices =
            this.state.totalDevices && devices.length < this.state.devices.length
                ? this.state.totalDevices - 1
                : undefined;
        this.setState({ devices, totalDevices });
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
                style={{ minWidth: 120, marginRight: 8, marginTop: 12.5 }}
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

    /** Collects the resolved model values reported by the cards and keeps the distinct, sorted list in state */
    private reportModel = (deviceId: DeviceId, model: string | undefined): void => {
        const key = JSON.stringify(deviceId);
        if (model) {
            if (this.modelValues.get(key) === model) {
                return;
            }
            this.modelValues.set(key, model);
        } else if (this.modelValues.has(key)) {
            this.modelValues.delete(key);
        } else {
            return;
        }
        const modelOptions = Array.from(new Set(this.modelValues.values())).sort();
        if (
            modelOptions.length !== this.state.modelOptions.length ||
            modelOptions.some((model, i) => model !== this.state.modelOptions[i])
        ) {
            this.setState({ modelOptions });
        }
    };

    /** The selected filter field, falling back to `name` if the stored field is not present on any current device */
    private getEffectiveFilterField(): DeviceFilterField {
        const field = this.state.filterField;
        if (field !== 'name' && this.state.devices.some(device => device[field] !== undefined)) {
            return field;
        }
        return 'name';
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
        if (this.state.devices.some(device => device.model !== undefined)) {
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
                    const filterField = e.target.value as DeviceFilterField;
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

    renderContent(): JSX.Element | JSX.Element[] | null {
        const emptyStyle: React.CSSProperties = {
            padding: 25,
        };

        if ((this.props.triggerLoad || 0) !== this.lastTriggerLoad) {
            this.lastTriggerLoad = this.props.triggerLoad || 0;
            setTimeout(() => this.loadDeviceList(), 50);
        }

        // if instance changed
        if (this.lastInstance !== this.state.selectedInstance) {
            this.lastInstance = this.state.selectedInstance;
            setTimeout(async (): Promise<void> => {
                if (this.state.selectedInstance) {
                    try {
                        await this.loadAllData();
                    } catch (error) {
                        console.error(error);
                    }
                } else {
                    this.loadDeviceList();
                }
            }, 50);
        }
        if (this.props.selectedInstance && this.props.selectedInstance !== this.state.selectedInstance) {
            setTimeout(() => this.setState({ selectedInstance: this.props.selectedInstance! }), 50);
        }
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

                if (this.state.groupKey) {
                    // filter out all devices belonging to this group
                    if (this.state.groupKey === '?') {
                        filteredDevices = filteredDevices.filter(device => !device.group?.key);
                    } else {
                        filteredDevices = filteredDevices.filter(device => device.group?.key === this.state.groupKey);
                    }
                }
            }

            if (this.state.selectedInstance) {
                list = filteredDevices.map(device => (
                    <DeviceCard
                        key={JSON.stringify(device.id)}
                        smallCards={this.props.smallCards ?? this.state.instanceInfo?.smallCards}
                        filter={this.props.embedded ? this.props.filter : this.state.filter}
                        alive={!!this.state.alive}
                        id={device.id}
                        identifierLabel={this.state.instanceInfo?.identifierLabel ?? 'ID'}
                        device={device}
                        instanceId={this.state.selectedInstance}
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
                        onlyUpdatable={this.state.onlyUpdatable}
                        onlyBatteryProblem={this.state.onlyBatteryProblem}
                        filterField={this.props.embedded ? undefined : this.getEffectiveFilterField()}
                        onModel={this.reportModel}
                    />
                ));
                if (this.state.loading) {
                    const skeletons = (this.state.totalDevices ?? list.length + 1) - list.length;
                    for (let i = 0; i < skeletons; i++) {
                        list.push(
                            <DeviceCardSkeleton
                                key={`skeleton-${i}`}
                                smallCards={this.props.smallCards ?? this.state.instanceInfo?.smallCards}
                                theme={this.props.theme}
                            />,
                        );
                    }
                } else if (this.state.devices.length > 0) {
                    list.push(
                        <Box
                            key="filtered"
                            sx={{
                                padding: '25px',
                                '&:not(:first-child)': {
                                    display: 'none',
                                },
                            }}
                        >
                            <span>{getTranslation('allDevicesFilteredOut')}</span>
                        </Box>,
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
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <Toolbar
                    variant="dense"
                    style={{ backgroundColor: '#777', display: 'flex' }}
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
                    {!this.state.apiVersionError && this.state.alive && this.state.instanceInfo?.actions?.length ? (
                        <div style={{ marginLeft: 20 }}>
                            {this.state.instanceInfo.actions.map(action => (
                                <InstanceActionButton
                                    key={action.id}
                                    action={action}
                                    instanceHandler={this.instanceHandler}
                                />
                            ))}
                        </div>
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
                    {!this.state.apiVersionError && this.state.alive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FilterAlt style={{ color: '#fff' }} />
                            {this.renderFilterFields()}
                            {this.renderFilterValue()}
                        </div>
                    ) : null}
                    <Typography
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
                    style={{
                        width: '100%',
                        height: 'calc(100% - 56px)',
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
