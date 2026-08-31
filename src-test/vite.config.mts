import { resolve } from 'node:path';
import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The test app imports the library from `../../src`, so react, react-dom and emotion have to be
 * pinned to the copies below `src-test/node_modules` - otherwise two React instances end up in the
 * bundle and every hook breaks.
 * @param name package name below `src-test/node_modules`
 * @returns the absolute path of that package
 */
function ownCopy(name: string): string {
    return resolve(import.meta.dirname, 'node_modules', name);
}

/** Log what goes to the ioBroker admin, so a failing socket connection is easy to spot */
const logProxy: ProxyOptions['configure'] = proxy => {
    proxy.on('error', err => console.log('proxy error', err));
    proxy.on('proxyReq', (_proxyReq, req) => console.log('Sending Request to the Target:', req.method, req.url));
    proxy.on('proxyRes', (proxyRes, req) =>
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url),
    );
};

export default defineConfig({
    build: {
        outDir: 'build',
    },
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            react: ownCopy('react'),
            'react-dom': ownCopy('react-dom'),
            '@emotion/react': ownCopy('@emotion/react'),
            '@emotion/styled': ownCopy('@emotion/styled'),
            '@emotion/cache': ownCopy('@emotion/cache'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/adapter': {
                target: 'http://localhost:8081',
                changeOrigin: true,
                secure: false,
                configure: logProxy,
            },
        },
    },
});
