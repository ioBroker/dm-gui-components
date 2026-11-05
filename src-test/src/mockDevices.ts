import type { Connection } from '@iobroker/gui-components';

/** The device types of the mock, as icons of `DeviceTypeIcon`. `undefined`: no icon, the card shows the initial. */
const ICONS = ['light', 'socket', 'thermostat', undefined, 'dimmer', 'blind', 'temperature', 'motion', 'door', 'lock'];
const CONNECTION_TYPES = ['wifi', 'zigbee', 'lan', 'bluetooth', 'thread', undefined, 'z-wave'];
const BATTERIES: (number | string | boolean | undefined)[] = [100, 64, 42, 22, 8, 'charging', '3000', true, false, 90];
const LONG_NAMES = ['Living room ceiling light above the dining table', 'Garage door opener (left side)'];

interface MockDevice {
    id: string;
    name: string;
    [key: string]: unknown;
}

/**
 * Test tool: answers the device manager protocol with synthetic devices.
 *
 * Activated with `?mock=<count>` in the URL, e.g. http://localhost:3000/?mock=120 - then any
 * instance picked in the list reports that many devices instead of its real ones. No adapter on a
 * development machine has the few hundred devices needed to see how the list behaves at that size
 * (see ioBroker/ioBroker.matter#864), so this is the only way to test it locally.
 *
 * The devices are delivered in batches of ten through `dm:deviceLoadProgress`, exactly like a real
 * v3 backend, so the incremental loading path is covered as well.
 *
 * The devices differ in icon, connection, battery, signal, warnings, controls and actions, so that all
 * parts of a card can be seen. The actions answer like a backend: "refresh" sends new status values
 * (the LED pulses, battery and signal slide to the new values), "info" shows a message, "qrcode" fails
 * with an error, the switch enables and disables the device and the others simply succeed.
 *
 * @param socket the connection whose `sendTo` is intercepted
 * @param count how many devices to report
 */
export function installMockDeviceManager(socket: Connection, count: number): void {
    const original = socket.sendTo.bind(socket);
    const BATCH = 10;
    const controlStates = new Map<string, ioBroker.StateValue>();

    const devices: MockDevice[] = Array.from({ length: count }, (_, i) => {
        const allActions = [
            { id: 'rename', icon: 'rename', description: 'Rename this device' },
            { id: 'settings', icon: 'settings', description: 'Configure this device' },
            { id: 'delete', icon: 'delete', description: 'Delete this device' },
            { id: 'refresh', icon: 'refresh', description: 'Read the status of this device again' },
            { id: 'info', icon: 'info', description: 'Info about this device' },
            { id: 'qrcode', icon: 'qrcode', description: 'Pairing code' },
            { id: 'identify', icon: 'identify', description: 'Let the device blink' },
        ];
        // Not every device has every action
        const actions = allActions.filter((_a, n) => (i + n) % 3 !== 0 || n < 3);
        const hasSwitch = i % 3 === 1;
        if (hasSwitch) {
            actions.push({ id: 'enable/disable', icon: 'settings', description: '' });
        }

        let controls: unknown[] | undefined;
        if (i % 4 === 1) {
            controls = [{ id: 'play', type: 'icon', icon: 'play', state: { val: false, ts: 1 } }];
        } else if (i % 7 === 2) {
            controls = [
                { id: 'power', type: 'switch', label: 'Power', state: { val: true, ts: 1 } },
                {
                    id: 'level',
                    type: 'slider',
                    label: 'Level',
                    min: 0,
                    max: 100,
                    state: { val: 40, ts: 1 },
                },
                { id: 'extra', type: 'group', label: 'Extended' },
                {
                    id: 'mode',
                    type: 'select',
                    label: 'Mode',
                    group: 'extra',
                    options: [
                        { label: 'Eco', value: 'eco' },
                        { label: 'Comfort', value: 'comfort' },
                    ],
                    state: { val: 'eco', ts: 1 },
                },
            ];
        }

        return {
            id: `mock-${i}`,
            name: i % 8 === 5 ? LONG_NAMES[i % 2] : `Mock device ${i}`,
            identifier: `ID-${1000 + i}`,
            manufacturer: `Vendor ${i % 5}`,
            model: `Model ${i % 7}`,
            icon: ICONS[i % ICONS.length],
            connectionType: CONNECTION_TYPES[i % CONNECTION_TYPES.length],
            // two devices bring their own color
            backgroundColor: i % 10 === 7 ? '#6d4c9f' : i % 10 === 9 ? '#c75b12' : undefined,
            enabled: hasSwitch ? i % 6 !== 4 : undefined,
            hasDetails: i % 5 === 0,
            status: {
                connection: i % 4 ? 'connected' : 'disconnected',
                battery: BATTERIES[i % BATTERIES.length],
                rssi: -40 - ((i * 7) % 52),
                warning: i % 11 === 3 ? 'The sensor is not calibrated' : undefined,
            },
            indicators:
                i % 6 === 2
                    ? [
                          {
                              id: 'temperature',
                              icon: 'fa-eye',
                              value: 21.5,
                              showValue: true,
                              unit: '°C',
                              color: 'info',
                              tooltip: 'Temperature',
                              configurable: true,
                          },
                      ]
                    : undefined,
            // every sixth device has an update, for the "only updatable" filter
            update: i % 6 === 0 ? { available: true, version: '1.0.0', newVersion: '1.1.0' } : undefined,
            actions,
            controls,
            group: { key: `group-${i % 3}`, name: `Group ${i % 3}` },
        };
    });

    const findDevice = (id: unknown): MockDevice | undefined => devices.find(device => device.id === id);
    const result = (value: unknown): unknown => ({ origin: 0, type: 'result', result: value });

    (socket as unknown as { sendTo: Connection['sendTo'] }).sendTo = (async (
        instance: string,
        command: string,
        data: unknown,
    ): Promise<unknown> => {
        if (command === 'dm:instanceInfo') {
            // `&small` in the URL shows the small cards
            const smallCards = new URLSearchParams(window.location.search).has('small');
            return { apiVersion: 'v3', actions: [], identifierLabel: 'ID', smallCards };
        }
        if (command === 'dm:loadDevices') {
            return { total: count, add: devices.slice(0, BATCH), next: BATCH < count ? BATCH : undefined };
        }
        if (command === 'dm:deviceLoadProgress') {
            const from = data as number;
            return {
                total: count,
                add: devices.slice(from, from + BATCH),
                next: from + BATCH < count ? from + BATCH : undefined,
            };
        }
        if (command === 'dm:deviceAction') {
            const { deviceId, actionId } = data as { deviceId: string; actionId: string };
            const device = findDevice(deviceId);
            // a short delay, so the spinner and then the check mark can be seen
            await new Promise(resolve => setTimeout(resolve, 400));
            if (!device) {
                return result({ error: { code: 404, message: `Unknown device ${deviceId}` } });
            }
            if (actionId === 'refresh') {
                const status = device.status as Record<string, unknown>;
                const battery = typeof status.battery === 'number' ? Math.max(0, status.battery - 7) : status.battery;
                const updated = {
                    ...device,
                    status: { ...status, battery, rssi: -40 - Math.round(Math.random() * 50) },
                };
                devices[devices.indexOf(device)] = updated;
                return result({ update: updated });
            }
            if (actionId === 'enable/disable') {
                const updated = { ...device, enabled: !device.enabled };
                devices[devices.indexOf(device)] = updated;
                return result({ update: updated });
            }
            if (actionId === 'info') {
                return { origin: 0, type: 'message', message: `${device.name} is a mock device` };
            }
            if (actionId === 'qrcode') {
                return result({ error: { code: 500, message: 'The mock device has no pairing code' } });
            }
            return result({ refresh: false });
        }
        if (command === 'dm:actionProgress') {
            return result({ refresh: false });
        }
        if (command === 'dm:deviceControl' || command === 'dm:deviceControlState') {
            const { deviceId, controlId, state } = data as {
                deviceId: string;
                controlId: string;
                state?: ioBroker.StateValue;
            };
            const key = `${deviceId}/${controlId}`;
            if (command === 'dm:deviceControl') {
                controlStates.set(key, state ?? null);
            } else if (!controlStates.has(key)) {
                // not changed yet: the value from the control definition
                const control = (
                    findDevice(deviceId)?.controls as { id: string; state?: { val: ioBroker.StateValue } }[] | undefined
                )?.find(c => c.id === controlId);
                controlStates.set(key, control?.state?.val ?? null);
            }
            return result({
                deviceId,
                controlId,
                state: { val: controlStates.get(key) ?? null, ack: true, ts: Date.now(), lc: Date.now(), from: 'mock' },
            });
        }
        return original(instance, command, data as never);
    }) as Connection['sendTo'];

    console.log(`[mock] device manager mocked with ${count} devices`);
}
