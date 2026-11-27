import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Preview build for the NewGen 2nd® Gen shell, served under /NewGen/2nd/ so it
// never collides with the live Jekyll pages. Ship build (planned, not yet approved):
// ASTRO_BASE=/NewGen/ npm run build, then copy dist/Sony/CRT-VR/index.html over
// Sony/CRT-VR/index.html at the repo root. See astro/README.md, "Shipping".
export default defineConfig({
  site: 'https://cookiesmuch.github.io',
  base: process.env.ASTRO_BASE ?? '/NewGen/2nd/',
  trailingSlash: 'always',
  output: 'static',
  outDir: './dist',
  // Jekyll skips _-prefixed folders, so the shipped build emits assets under assets/.
  build: { assets: 'assets' },
  integrations: [react()],
});
