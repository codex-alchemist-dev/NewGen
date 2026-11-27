import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Preview build for the NewGen 2nd® Gen shell. Served under /NewGen/2nd/ so it
// never collides with the live Jekyll pages at /NewGen/Sony/CRT-VR/.
export default defineConfig({
  site: 'https://cookiesmuch.github.io',
  base: '/NewGen/2nd/',
  trailingSlash: 'always',
  output: 'static',
  outDir: './dist',
  integrations: [react()],
});
