import type { Connection } from '@iobroker/gui-components';

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
 * @param socket the connection whose `sendTo` is intercepted
 * @param count how many devices to report
 */
export function installMockDeviceManager(socket: Connection, count: number): void {
    const original = socket.sendTo.bind(socket);
    const BATCH = 10;

    const devices = Array.from({ length: count }, (_, i) => ({
        id: `mock-${i}`,
        name: `Mock device ${i}`,
        identifier: `ID-${1000 + i}`,
        manufacturer: `Vendor ${i % 5}`,
        model: `Model ${i % 7}`,
        hasDetails: false,
        status: {
            connection: i % 4 ? 'connected' : 'disconnected',
            // every third device has a battery problem, for the battery filter
            battery: i % 3 === 0 ? 12 : 90,
            rssi: -40 - (i % 50),
        },
        // every sixth device has an update, for the "only updatable" filter
        update: i % 6 === 0 ? { available: true, version: '1.0.0', newVersion: '1.1.0' } : undefined,
        actions: [
            { id: 'rename', icon: 'rename', description: 'Rename this device' },
            { id: 'settings', icon: 'settings', description: 'Configure this device' },
            { id: 'delete', icon: 'delete', description: 'Delete this device' },
            { id: 'refresh', icon: 'refresh', description: 'Refresh this device' },
            { id: 'info', icon: 'info', description: 'Info about this device' },
            { id: 'qrcode', icon: 'qrcode', description: 'Pairing code' },
        ],
        group: { key: `group-${i % 3}`, name: `Group ${i % 3}` },
    }));

    (socket as unknown as { sendTo: Connection['sendTo'] }).sendTo = (async (
        instance: string,
        command: string,
        data: unknown,
    ): Promise<unknown> => {
        if (command === 'dm:instanceInfo') {
            return { apiVersion: 'v3', actions: [], identifierLabel: 'ID' };
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
        return original(instance, command, data as never);
    }) as Connection['sendTo'];

    console.log(`[mock] device manager mocked with ${count} devices`);
}
