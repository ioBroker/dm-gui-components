# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@iobroker/dm-gui-components` is a React component library that provides the admin UI for the ioBroker device manager. It is consumed by ioBroker adapter admin interfaces. The single default export is `DeviceList`, which renders a device management panel for a given adapter instance.

## Commands

- **Build:** `npm run build` (runs `tsc && tsc-alias`, outputs to `build/`)
- **Type-check only:** `npm run check-ts`
- **Lint:** `npm run lint`
- **Release:** `npm run release-patch`, `npm run release-minor`, `npm run release-major` (uses `@alcalzone/release-script`; the release config runs `npm run build` before commit)

There are no tests in this project.

## Architecture

### Component Hierarchy

```
DeviceList  (src/DeviceList.tsx)
  extends Communication  (src/Communication.tsx)
    extends React.Component
```

`Communication` is the base class that owns all backend interaction logic: sending actions/controls to the adapter instance, rendering dialogs (message, confirm, form, progress, input), and managing the protocol. `DeviceList` adds device loading, filtering, grouping, instance selection, and the toolbar UI.

### Protocol Layer

Communication with adapter backends uses a versioned protocol negotiated at runtime via `dm:instanceInfo`:

```
DmProtocolBase (abstract)       src/protocol/DmProtocolBase.ts
  DmProtocolV1                  src/protocol/DmProtocolV1.ts
    DmProtocolV2 (extends V1)   src/protocol/DmProtocolV2.ts
  DmProtocolV3                  src/protocol/DmProtocolV3.ts
  UnknownDmProtocol             src/protocol/UnknownDmProtocol.ts
```

- **V1/V2** use `dm:listDevices` (single batch) and translate V1 response shapes into the V3 canonical format.
- **V3** uses incremental `dm:loadDevices` / `dm:deviceLoadProgress` for paginated loading and natively matches the internal types.
- Protocol selection happens in `Communication.loadInstanceInfos()` based on `apiVersion` from the backend.
- Types are re-exported from `@iobroker/dm-utils` via `src/protocol/api.ts`. V1 compatibility types come from `@iobroker/dm-utils-v1` (aliased in package.json).

### Key Patterns

- **Class components** throughout (not functional). `Communication` and `DeviceList` are class-based with typed state/props generics.
- **`@iobroker/adapter-react-v5`** provides `Connection` (socket), `I18n`, `Icon`, theme types, and `DeviceTypeIcon`.
- **`@iobroker/json-config`** renders dynamic forms from JSON schemas via `JsonConfigComponent`, wrapped in `src/JsonConfig.tsx`.
- **i18n**: 11 language files in `src/i18n/`. Translations are loaded once via `I18n.extendTranslations()` in `DeviceList` constructor. The `getTranslation()` helper in `Utils.tsx` handles `StringOrTranslated` objects.
- **`StateOrObjectHandler`** (`src/StateOrObjectHandler.ts`) manages subscriptions to ioBroker states and objects with ref-counted shared subscriptions and a `useStateOrObject` hook (`src/hooks.ts`).
- **Icon resolution** in `Utils.tsx`: maps action/control IDs and font-awesome names to MUI icons.

### Module System

- ESNext modules (`"module": "esnext"` in tsconfig)
- Published entry point: `build/index.js` / `build/index.d.ts`
- `tsc-alias` resolves path aliases after compilation
- `src/index.ts` and `src/index.js` both export `DeviceList` as the default export
