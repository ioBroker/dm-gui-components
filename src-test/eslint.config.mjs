import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    // vite.config.mts is type checked by tsconfig.node.json, which the project
                    // service does not find on its own - it only looks for a tsconfig.json
                    allowDefaultProject: ['*.js', '*.mjs', '*.mts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
        },
    },
    {
        ignores: ['build/**/*', 'node_modules/**/*'],
    },
];
