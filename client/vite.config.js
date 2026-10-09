import { defineConfig } from 'vite';
export default defineConfig({ esbuild: { jsxFactory: 'translatedJsx' }, server: { host: '0.0.0.0', proxy: { '/api': process.env.API_PROXY_TARGET || 'http://localhost:4000' } } });
