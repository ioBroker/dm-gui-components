import React from 'react';
import { IconButton, InputAdornment, TextField, Toolbar, Tooltip, LinearProgress, Select, MenuItem, Box, Card, CardActionArea, CardContent, Typography, } from '@mui/material';
import { ArrowBack, Clear, QuestionMark, Refresh, FilterAltOff } from '@mui/icons-material';
import { I18n, DeviceTypeIcon, Icon } from '@iobroker/adapter-react-v5';
import DeviceCard, { DeviceCardSkeleton } from './DeviceCard';
import { getTranslation } from './Utils';
import Communication from './Communication';
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
/**
 * Device List Component
 */
export default class DeviceList extends Communication {
    static i18nInitialized = false;
    lastInstance;
    lastAliveSubscribe = '';
    lastTriggerLoad = 0;
    filterTimeout = null;
    language = I18n.getLanguage();
    constructor(props) {
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
        };
        if (this.props.selectedInstance === undefined) {
            // Start with the root page that shows all instances as cards
            this.state = { ...this.state, selectedInstance: '' };
        }
        this.lastInstance = this.state.selectedInstance;
        this.lastTriggerLoad = this.props.triggerLoad || 0;
    }
    setStateAsync(state) {
        return new Promise(resolve => this.setState(state, resolve));
    }
    async loadAdapters() {
        await this.props.socket.waitForFirstConnection();
        console.log('Loading adapters...');
        const res = await this.props.socket.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.\u9999');
        const dmInstances = {};
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
            }
            catch (error) {
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
        }
        else {
            await this.setStateAsync({ dmInstances });
        }
    }
    selectInstance(instanceId) {
        window.localStorage.setItem('dmSelectedInstance', instanceId);
        this.setState({
            selectedInstance: instanceId,
            groupKey: window.localStorage.getItem(`dm_group_${instanceId}`) || '',
        });
    }
    backToInstancesList() {
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
    refreshInstanceList() {
        this.setState({ dmInstances: null }, () => this.loadAdapters().catch(console.error));
    }
    async componentDidMount() {
        let alive = false;
        // If an instance selector must be shown
        if (this.props.selectedInstance === undefined) {
            // show instance selector
            await this.loadAdapters();
        }
        if (this.state.alive === null && this.state.selectedInstance) {
            try {
                // check if the instance is alive
                const stateAlive = await this.props.socket.getState(`system.adapter.${this.state.selectedInstance}.alive`);
                if (stateAlive?.val) {
                    alive = true;
                }
            }
            catch (error) {
                console.error(error);
            }
            this.lastAliveSubscribe = this.state.selectedInstance;
            this.setState({ alive }, () => this.props.socket.subscribeState(`system.adapter.${this.state.selectedInstance}.alive`, this.aliveHandler));
        }
        else if (this.state.alive !== null) {
            alive = this.state.alive;
        }
        if (alive) {
            try {
                await this.loadAllData();
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    componentWillUnmount() {
        if (this.state.selectedInstance) {
            this.props.socket.unsubscribeState(`system.adapter.${this.state.selectedInstance}.alive`, this.aliveHandler);
        }
    }
    aliveHandler = (id, state) => {
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
    async loadAllData() {
        await this.loadInstanceInfos();
        this.loadDeviceList();
    }
    async loadInstanceInfos() {
        const instanceInfo = await super.loadInstanceInfos();
        return new Promise(resolve => this.setState({ instanceInfo, apiVersionError: !['v1', 'v2', 'v3'].includes(instanceInfo.apiVersion) }, () => resolve(instanceInfo)));
    }
    /**
     * Load devices
     */
    loadDeviceList() {
        this.setState({ loading: true }, async () => {
            console.log(`Loading devices for ${this.state.selectedInstance}...`);
            let alive = this.state.alive;
            if (this.state.selectedInstance !== this.lastAliveSubscribe) {
                if (this.lastAliveSubscribe) {
                    // unsubscribe from the old instance
                    this.props.socket.unsubscribeState(`system.adapter.${this.lastAliveSubscribe}.alive`, this.aliveHandler);
                }
                this.lastAliveSubscribe = this.state.selectedInstance;
                if (this.state.selectedInstance) {
                    try {
                        // check if the instance is alive
                        const stateAlive = await this.props.socket.getState(`system.adapter.${this.state.selectedInstance}.alive`);
                        if (stateAlive?.val) {
                            alive = true;
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                    await this.props.socket.subscribeState(`system.adapter.${this.state.selectedInstance}.alive`, this.aliveHandler);
                }
                else {
                    alive = false;
                }
            }
            let devices = [];
            try {
                this.setState({ devices, loading: !!alive, alive });
                if (alive) {
                    await this.loadDevices((batch, total) => {
                        devices = devices.concat(batch);
                        this.setState({ devices, loading: true, totalDevices: total });
                        console.log(`Loaded ${devices.length} of ${total} devices...`);
                    });
                }
            }
            catch (error) {
                console.error(error);
                devices = [];
            }
            this.setState({ devices, loading: false, totalDevices: devices.length });
            console.log(`Loaded ${devices.length} devices for ${this.state.selectedInstance}`);
        });
    }
    updateDevice(update) {
        const updateId = JSON.stringify(update.id);
        this.setState({ devices: this.state.devices.map(d => (JSON.stringify(d.id) === updateId ? update : d)) });
    }
    deleteDevice(deviceId) {
        const deleteId = JSON.stringify(deviceId);
        const devices = this.state.devices.filter(d => JSON.stringify(d.id) !== deleteId);
        const totalDevices = this.state.totalDevices && devices.length < this.state.devices.length
            ? this.state.totalDevices - 1
            : undefined;
        this.setState({ devices, totalDevices });
    }
    getText(text) {
        if (typeof text === 'object') {
            return text[this.language] || text.en;
        }
        return text;
    }
    handleFilterChange(filter) {
        this.setState({ filterText: filter });
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(() => {
            this.filterTimeout = null;
            this.setState({ filter });
        }, 250);
    }
    renderGroups(groups) {
        if (!groups?.length) {
            return null;
        }
        return (React.createElement(Select, { style: { minWidth: 120, marginRight: 8, marginTop: 12.5 }, variant: "standard", value: this.state.groupKey || '_', renderValue: value => {
                if (value === '_') {
                    value = '';
                }
                const g = groups.find(g => g.value === value);
                return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                    g?.icon || React.createElement("div", { style: { width: 24 } }),
                    g?.name || value));
            }, onChange: e => {
                if (e.target.value) {
                    window.localStorage.setItem(`dm_group_${this.state.selectedInstance}`, e.target.value);
                }
                else {
                    window.localStorage.removeItem(`dm_group_${this.state.selectedInstance}`);
                }
                this.setState({ groupKey: e.target.value === '_' ? '' : e.target.value });
            } }, groups.map(g => (React.createElement(MenuItem, { value: g.value || '_', key: g.value || '_', style: { display: 'flex', alignItems: 'center', gap: 8 } },
            g.icon || React.createElement("div", { style: { width: 24 } }),
            g.name)))));
    }
    renderInstanceCards() {
        if (!this.state.dmInstances) {
            return [
                React.createElement(LinearProgress, { key: "loadingInstances", style: { width: '100%' } }),
            ];
        }
        const instanceIds = Object.keys(this.state.dmInstances);
        if (!instanceIds.length) {
            return [
                React.createElement("div", { style: { padding: 25 }, key: "noInstances" },
                    React.createElement("span", null, getTranslation('noInstancesFoundText'))),
            ];
        }
        const backgroundColor = this.props.theme.palette.mode === 'dark' ? '#0b0b0b' : '#d5d5d5';
        if (this.props.smallCards) {
            return instanceIds.map(id => {
                const info = this.state.dmInstances[id];
                return (React.createElement(Card, { key: id, sx: { width: 200, margin: '5px', backgroundColor } },
                    React.createElement(CardActionArea, { onClick: () => this.selectInstance(id), style: { height: '100%' } },
                        React.createElement(CardContent, { style: {
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: 8,
                            } },
                            info.icon ? (React.createElement(Icon, { src: info.icon, style: { width: 32, height: 32, flexShrink: 0 } })) : (React.createElement(QuestionMark, { style: { width: 32, height: 32, flexShrink: 0 } })),
                            React.createElement("div", { style: { overflow: 'hidden' } },
                                React.createElement(Typography, { variant: "body1", noWrap: true, style: { fontSize: 14, fontWeight: 'bold' } }, id),
                                info.title ? (React.createElement(Typography, { variant: "caption", color: "textSecondary", noWrap: true, component: "div" }, info.title)) : null)))));
            });
        }
        return instanceIds.map(id => {
            const info = this.state.dmInstances[id];
            return (React.createElement(Card, { key: id, sx: { width: 240, margin: '10px', backgroundColor } },
                React.createElement(CardActionArea, { onClick: () => this.selectInstance(id), style: { height: '100%' } },
                    React.createElement(CardContent, { style: {
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                        } },
                        info.icon ? (React.createElement(Icon, { src: info.icon, style: { width: 64, height: 64 } })) : (React.createElement(QuestionMark, { style: { width: 64, height: 64 } })),
                        React.createElement(Typography, { variant: "h6", style: { textAlign: 'center', wordBreak: 'break-all' } }, id),
                        info.title ? (React.createElement(Typography, { variant: "body2", color: "textSecondary", style: { textAlign: 'center' } }, info.title)) : null))));
        });
    }
    renderContent() {
        const emptyStyle = {
            padding: 25,
        };
        if ((this.props.triggerLoad || 0) !== this.lastTriggerLoad) {
            this.lastTriggerLoad = this.props.triggerLoad || 0;
            setTimeout(() => this.loadDeviceList(), 50);
        }
        // if instance changed
        if (this.lastInstance !== this.state.selectedInstance) {
            this.lastInstance = this.state.selectedInstance;
            setTimeout(async () => {
                if (this.state.selectedInstance) {
                    try {
                        await this.loadAllData();
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                else {
                    this.loadDeviceList();
                }
            }, 50);
        }
        if (this.props.selectedInstance && this.props.selectedInstance !== this.state.selectedInstance) {
            setTimeout(() => this.setState({ selectedInstance: this.props.selectedInstance }), 50);
        }
        const deviceGroups = [];
        const showRootPage = !this.props.embedded && this.props.selectedInstance === undefined && !this.state.selectedInstance;
        let list;
        if (showRootPage) {
            list = this.renderInstanceCards();
        }
        else if (!this.props.embedded && !this.state.alive) {
            list = [
                React.createElement("div", { style: emptyStyle, key: "notAlive" },
                    React.createElement("span", null, getTranslation('instanceNotAlive'))),
            ];
        }
        else if (!this.state.devices.length && this.state.selectedInstance && !this.state.loading) {
            list = [
                React.createElement("div", { style: emptyStyle, key: "notFound" },
                    React.createElement("span", null, getTranslation('noDevicesFoundText'))),
            ];
        }
        else {
            // build a device types list
            let filteredDevices = this.state.devices;
            if (!this.state.loading && !this.props.embedded && filteredDevices.find(device => device.group)) {
                deviceGroups.push({
                    name: I18n.t('All'),
                    value: '',
                    count: filteredDevices.length,
                    icon: React.createElement(FilterAltOff, null),
                });
                filteredDevices.forEach(device => {
                    if (device.group) {
                        const type = deviceGroups.find(t => t.value === device.group?.key);
                        if (type) {
                            type.count++;
                        }
                        else {
                            const icon = device.group.icon ? React.createElement(DeviceTypeIcon, { src: device.group.icon }) : null;
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
                        icon: React.createElement(QuestionMark, null),
                    });
                }
                if (this.state.groupKey) {
                    // filter out all devices belonging to this group
                    if (this.state.groupKey === '?') {
                        filteredDevices = filteredDevices.filter(device => !device.group?.key);
                    }
                    else {
                        filteredDevices = filteredDevices.filter(device => device.group?.key === this.state.groupKey);
                    }
                }
            }
            if (this.state.selectedInstance) {
                list = filteredDevices.map(device => (React.createElement(DeviceCard, { key: JSON.stringify(device.id), smallCards: this.props.smallCards ?? this.state.instanceInfo?.smallCards, filter: this.props.embedded ? this.props.filter : this.state.filter, alive: !!this.state.alive, id: device.id, identifierLabel: this.state.instanceInfo?.identifierLabel ?? 'ID', device: device, instanceId: this.state.selectedInstance, uploadImagesToInstance: this.props.uploadImagesToInstance, deviceHandler: this.deviceHandler, controlHandler: this.controlHandler, controlStateHandler: this.controlStateHandler, socket: this.props.socket, themeName: this.props.themeName, themeType: this.props.themeType, theme: this.props.theme, isFloatComma: this.props.isFloatComma, dateFormat: this.props.dateFormat })));
                if (this.state.loading) {
                    const skeletons = (this.state.totalDevices ?? list.length + 1) - list.length;
                    for (let i = 0; i < skeletons; i++) {
                        list.push(React.createElement(DeviceCardSkeleton, { key: `skeleton-${i}`, smallCards: this.props.smallCards ?? this.state.instanceInfo?.smallCards, theme: this.props.theme }));
                    }
                }
                else if (this.state.devices.length > 0) {
                    list.push(React.createElement(Box, { key: "filtered", sx: {
                            padding: '25px',
                            '&:not(:first-child)': {
                                display: 'none',
                            },
                        } },
                        React.createElement("span", null, getTranslation('allDevicesFilteredOut'))));
                }
            }
            else {
                list = [
                    React.createElement("div", { style: emptyStyle, key: "selectInstance" },
                        React.createElement("span", null, getTranslation('selectInstanceText'))),
                ];
            }
        }
        if (this.props.embedded) {
            return (React.createElement(React.Fragment, null,
                this.state.loading ? React.createElement(LinearProgress, { style: { width: '100%' } }) : null,
                this.state.apiVersionError ? React.createElement("div", null, I18n.t('apiVersionError')) : list));
        }
        return (React.createElement("div", { style: { width: '100%', height: '100%', overflow: 'hidden' } },
            React.createElement(Toolbar, { variant: "dense", style: { backgroundColor: '#777', display: 'flex' } },
                this.props.title,
                this.props.selectedInstance === undefined &&
                    this.state.dmInstances &&
                    this.state.selectedInstance ? (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                    Object.keys(this.state.dmInstances).length > 1 ? (React.createElement(Tooltip, { title: getTranslation('backToInstancesList'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
                        React.createElement(IconButton, { onClick: () => this.backToInstancesList(), size: "small" },
                            React.createElement(ArrowBack, null)))) : null,
                    this.state.dmInstances[this.state.selectedInstance]?.icon ? (React.createElement(Icon, { src: this.state.dmInstances[this.state.selectedInstance].icon, style: { width: 24, height: 24 } })) : null,
                    React.createElement("span", { style: { marginRight: 8 } }, this.state.selectedInstance))) : null,
                this.props.selectedInstance === undefined && !this.state.selectedInstance ? (React.createElement(Tooltip, { title: getTranslation('refreshInstanceList'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
                    React.createElement("span", null,
                        React.createElement(IconButton, { onClick: () => this.refreshInstanceList(), disabled: !this.state.dmInstances, size: "small" },
                            React.createElement(Refresh, null))))) : null,
                this.state.selectedInstance ? (React.createElement(Tooltip, { title: getTranslation('refreshTooltip'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
                    React.createElement("span", null,
                        React.createElement(IconButton, { onClick: () => this.loadAllData(), disabled: !this.state.alive || this.state.apiVersionError, size: "small" },
                            React.createElement(Refresh, null))))) : null,
                !this.state.apiVersionError && this.state.alive && this.state.instanceInfo?.actions?.length ? (React.createElement("div", { style: { marginLeft: 20 } }, this.state.instanceInfo.actions.map(action => (React.createElement(InstanceActionButton, { key: action.id, action: action, instanceHandler: this.instanceHandler }))))) : null,
                React.createElement("div", { style: { flexGrow: 1 } }),
                !this.state.apiVersionError && this.renderGroups(deviceGroups),
                !this.state.apiVersionError && this.state.alive ? (React.createElement(TextField, { variant: "standard", style: { width: 200 }, size: "small", label: getTranslation('filterLabelText'), onChange: e => this.handleFilterChange(e.target.value), value: this.state.filterText, autoComplete: "off", slotProps: {
                        input: {
                            autoComplete: 'new-password',
                            endAdornment: this.state.filterText ? (React.createElement(InputAdornment, { position: "end" },
                                React.createElement(IconButton, { tabIndex: -1, onClick: () => this.handleFilterChange(''), edge: "end" },
                                    React.createElement(Clear, null)))) : null,
                        },
                        htmlInput: {
                            autoComplete: 'off',
                        },
                    } })) : null),
            React.createElement("div", { style: {
                    width: '100%',
                    height: 'calc(100% - 56px)',
                    marginTop: 8,
                    overflow: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'stretch',
                    alignContent: 'flex-start',
                    ...this.props.style,
                } },
                this.state.loading ? React.createElement(LinearProgress, { style: { width: '100%' } }) : null,
                this.state.apiVersionError ? React.createElement("div", null, I18n.t('apiVersionError')) : list)));
    }
}
//# sourceMappingURL=DeviceList.js.map