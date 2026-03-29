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

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

## Changelog
### 9.0.20 (2026-03-29)
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
