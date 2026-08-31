// Module augmentation, so this file has to be a module - hence the `export {}` at the end.
// The declarations for `*.css`, `*.svg`, `*.png`, ... and for `import.meta.env` come from
// `vite/client`, which is listed in the `types` of tsconfig.json.

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        grey: true;
    }
}

export {};
