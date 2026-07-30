# ReactJS component for ioBroker device manager

This component requires the [dm-utils](https://github.com/ioBroker/dm-utils) in an adapter.

## Usage

```jsx
import React from 'react';
import DeviceList from '@iobroker/dm-gui-components';

//...
render() {
   return <DeviceList
      socket={this.props.socket}
      selectedInstance="matter.0"
   />;
}
```

## Icon names

You can use the following icon names for actions and controls.
Icons are resolved by the action/control `id` or by the `icon` property. You can also provide a `data:image/...` base64 string for custom icons.

### Action and control icons (by name)

| Name(s)                    | MUI Icon           | Description                          |
|----------------------------|--------------------|--------------------------------------|
| `edit`, `rename`           | Edit               | Edit or rename an item               |
| `delete`                   | Delete             | Delete an item                       |
| `refresh`                  | Refresh            | Refresh / reload                     |
| `newDevice`, `new`, `add`  | Add                | Add or create a new item             |
| `discover`, `search`       | Search             | Discover or search for devices       |
| `unpairDevice`, `unpair`   | LinkOff            | Unpair / unlink a device             |
| `pairDevice`, `pair`       | Link               | Pair / link a device                 |
| `identify`                 | NotListedLocation  | Identify / locate a device           |
| `play`                     | PlayArrow          | Start playback                       |
| `stop`                     | Stop               | Stop playback                        |
| `pause`                    | Pause              | Pause playback                       |
| `forward`, `next`          | FastForward        | Skip forward / next track            |
| `rewind`, `previous`       | FastRewind         | Skip backward / previous track       |
| `lamp`, `light`            | Lightbulb          | Light / lamp control                 |
| `backlight`                | Fluorescent        | Backlight control                    |
| `dimmer`                   | WbIncandescent     | Dimmer control                       |
| `socket`                   | Power              | Power socket control                 |
| `settings`                 | Settings           | Settings / configuration             |
| `users`, `group`           | Group              | User group                           |
| `user`                     | Person             | Single user                          |
| `update`                   | Upgrade            | Update / upgrade                     |
| `qrcode`                   | QrCode             | QR code                              |
| `info`                     | Info               | Information                          |
| `lines`                    | Article            | Text lines / log                     |
| `web`                      | Launch             | Open web link                        |

Any unrecognized name renders a **QuestionMark** icon as fallback.

### Legacy Font Awesome icons

These names are supported for backward compatibility. Prefer the names from the table above.

| Name(s)                        | MUI Icon           | Description                    |
|--------------------------------|--------------------|--------------------------------|
| `fa-trash-can`, `fa-trash`     | Delete             | Delete                         |
| `fa-pen`                       | Edit               | Edit                           |
| `fa-redo-alt`                  | Refresh            | Refresh / redo                 |
| `fa-plus`                      | Add                | Add                            |
| `fa-qrcode`, `qrcode`          | QrCode             | QR code                        |
| `fa-wifi`                      | Wifi               | Wi-Fi enabled                  |
| `fa-wifi-slash`                | WifiOff            | Wi-Fi disabled                 |
| `fa-bluetooth`                 | Bluetooth          | Bluetooth enabled              |
| `fa-bluetooth-slash`           | BluetoothDisabled  | Bluetooth disabled             |
| `fa-eye`                       | Visibility         | View / visible                 |
| `fa-search`                    | Search             | Search                         |
| `fa-unlink`                    | LinkOff            | Unlink                         |
| `fa-link`                      | Link               | Link                           |
| `fa-search-location`           | NotListedLocation  | Search location / identify     |
| `fa-play`                      | PlayArrow          | Play                           |
| `fa-stop`                      | Stop               | Stop                           |
| `fa-pause`                     | Pause              | Pause                          |

Unrecognized FA names render a **QuestionMark** icon.

## Status line

The status line at the top of a device card shows the built-in indicators (connection, RSSI, battery,
warning, update, enabled). Two mechanisms let an adapter add its own entries there.

> **Note:** the types are defined in `@iobroker/dm-utils` from version 3.2.0 on
> (`StatusIndicator`, `StatusIndicatorLevel`, `IndicatorColor`, `ActionPlacement`) and are only
> re-exported here. See the README of `dm-utils` for the adapter side.

### Actions in the status line

Any action can be moved from the button row at the bottom of the card into the status line with
`placement: 'status'`:

```js
const actions = [{ id: 'openLog', icon: 'lines', placement: 'status', handler: openLogHandler }];
```

The action keeps all its features (`icon`, `color`, `title`, `confirmation`, `inputBefore`, `url`, …)
and is not rendered a second time in the footer.

### Custom indicators

`DeviceInfo.indicators` (device card) and `InstanceDetails.indicators` (toolbar) describe indicators
whose appearance follows a state or object value live. Every visual property accepts either a literal
value or a `{ stateId }` / `{ objectId, property }` reference.

| Property         | Description                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`             | Unique ID within the device / instance                                                                       |
| `value`          | Live value. Controls visibility, `iconOn`/`colorOn` and the matching `levels` entry                          |
| `icon`           | Icon name (see above), `fa-*`, `data:image/...`, URL or path                                                  |
| `iconOn`         | Icon used while the value is truthy                                                                           |
| `color`          | `ok`, `warning`, `error`, `info`, `inactive`, `primary`, `secondary` or a CSS color                           |
| `colorOn`        | Color used while the value is truthy                                                                          |
| `text`           | Text below the icon                                                                                           |
| `showValue`      | Show the value as text below the icon                                                                         |
| `unit`           | Appended to the text                                                                                          |
| `tooltip`        | Tooltip                                                                                                       |
| `levels`         | Value ranges mapped to `icon` / `color` / `text` / `tooltip`. First match wins                                 |
| `actionId`       | ID of an action of the same device/instance. Makes the indicator clickable                                    |
| `hideIfEmpty`    | Hide while the value is `undefined`, `null`, `''` or `false` (default `true`; the number `0` stays visible)    |
| `order`          | Sort order in the line (default 100)                                                                          |
| `configurable`   | Let the user show or hide this indicator in the toolbar                                                       |
| `defaultVisible` | Visibility of a configurable indicator until the user decides otherwise (default `true`)                      |
| `label`          | Name in the visibility settings. Falls back to `tooltip` and then to `id`                                     |

A `levels` entry matches by exact `value`, by `min`/`max` (both inclusive, numeric values only) or,
if it defines no condition at all, as a catch-all — put such an entry last.

If `actionId` is given, a click triggers that action through the normal device/instance action flow,
including `confirmation`, `inputBefore`, `url`, the progress dialog and the `refresh` handling. The
referenced action is then not rendered as a normal button anymore.

```js
const deviceInfo = {
    id: 'sensor-1',
    name: 'Window sensor kitchen',
    actions: [{ id: 'openLog', icon: 'lines', description: { en: 'Open device log' }, handler: openLogHandler }],
    status: { connection: { stateId: 'zigbee.0.abc.available', mapping: { true: 'connected', false: 'disconnected' } } },
    indicators: [
        {
            id: 'linkQuality',
            value: { stateId: 'zigbee.0.abc.link_quality' },
            icon: 'fa-wifi',
            showValue: true,
            unit: 'lqi',
            tooltip: { en: 'Link quality', de: 'Verbindungsqualität' },
            levels: [
                { max: 50, color: 'error' },
                { max: 100, color: 'warning' },
                { color: 'ok' },
            ],
            actionId: 'openLog',
        },
        {
            id: 'tamper',
            value: { stateId: 'zigbee.0.abc.tamper' },
            icon: 'fa-eye',
            colorOn: 'error',
            tooltip: { en: 'Tamper contact triggered' },
        },
    ],
};
```

The indicator line wraps if it does not fit on one line, so the number of indicators is not limited.

### Indicators the user can switch off

An indicator marked with `configurable: true` can be shown or hidden by the user through the
sliders button in the toolbar. The choice is stored in the browser (`localStorage`, one entry per
instance) and never reaches the backend. `defaultVisible: false` starts with a hidden indicator, so
rarely needed information does not clutter the cards of everybody.

Indicators with the same `id` — typically the same indicator on many devices — are configured
together. If a hidden indicator references an action, that action is hidden as well and does not
reappear as a button in the footer.

```js
const indicator = {
    id: 'tamper',
    value: { stateId: 'zigbee.0.abc.tamper' },
    icon: 'fa-eye',
    colorOn: 'error',
    label: { en: 'Tamper contact', de: 'Sabotagekontakt' },
    configurable: true,
    defaultVisible: false,
};
```

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

## Changelog
### 10.0.11 (2026-07-30)
- (@GermanBluefox) Improvement I18n

### 10.0.8 (2026-07-27)
- (@GermanBluefox) Added custom status indicators for devices and instances
- (@GermanBluefox) Added `placement: 'status'` for device actions
- (@GermanBluefox) Added user-configurable visibility of indicators

### 10.0.3 (2026-07-25)
# (@GermanBluefox) Breaking: React 19, MUI 9, TS 6

### 9.1.12 (2026-07-24)
- (@GermanBluefox) Updated packages

### 9.1.9 (2026-07-20)
- (@GermanBluefox) Fixing tabs

### 9.1.8 (2026-07-12)
- (@GermanBluefox) Strict types

### 9.1.7 (2026-06-21)
- (@GermanBluefox) Remove double loading of devices

### 9.1.6 (2026-06-21)
- (@GermanBluefox) Updated packages

### 9.1.5 (2026-06-20)
- (@GermanBluefox) Implemented filter on different fields (name, id, type, alive, enabled, connected, etc.)

### 9.1.1 (2026-06-13)
- (@GermanBluefox) Updated packages

### 9.1.0 (2026-06-06)
- (@GermanBluefox) Replaced the instance selector with a root page that shows all instances as cards; the toolbar shows a back arrow to return to the root page
- (@GermanBluefox) Updated packages

### 9.0.27 (2026-04-11)
- (@GermanBluefox) Fixed filter for devices

### 9.0.26 (2026-03-31)
- (@GermanBluefox) Added support for `applyDisabledRule`

### 9.0.24 (2026-03-30)
- (@GermanBluefox) Layout improved

### 9.0.7 (2026-03-27)
- (@GermanBluefox) Added possibility to show custom information on Card

### 9.0.6 (2026-03-26)

- (@GermanBluefox) Small layout optimizations for controls

### 9.0.3 (2026-03-04)

- (@UncleSamSwiss) Fix handling of "result" response from action handler (update, delete a device)
- (@UncleSamSwiss) Fix handling of V1 protocol action responses
- (@UncleSamSwiss) Fix handling of "refresh" response from instance actions

### 9.0.2 (2026-03-03)

- (@UncleSamSwiss) Implemented v3 protocol: added support to use states and objects as values

### 8.0.9 (2026-01-28)

- (@GermanBluefox) Analyze an API version and do not show anything if a version is higher than supported

### 8.0.8 (2026-01-27)

- (@GermanBluefox) Added support of instance selection if not provided

### 8.0.7 (2026-01-02)

- (@GermanBluefox) Added `ignoreApplyDisabled` flag

### 8.0.6 (2025-12-30)

- (@GermanBluefox) Added update icon for device actions
- (@GermanBluefox) Added indeterminate progress

### 8.0.4 (2025-10-25)

- (@GermanBluefox) Updated packages

### 8.0.2 (2025-10-23)

- (@GermanBluefox) Renamed gui-components to adapter-react-v5

### 8.0.1 (2025-10-23)

- (@GermanBluefox) Make package independent

### 0.0.10 (2023-12-14)

- (bluefox) Changed layout of the device list

### 0.0.7 (2023-12-14)

- (bluefox) Added alive flag

### 0.0.4 (2023-12-12)

- (bluefox) return the style of big cards

### 0.0.3 (2023-12-12)

- (bluefox) initial commit

## License

MIT License

Copyright (c) 2023-2026 Jey Cee <iobroker@all-smart.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
