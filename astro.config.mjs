import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://leveldesign.com.au',
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle every client dependency at dev-server start. Otherwise Vite discovers react-hook-form etc.
    // the first time a page uses them, re-bundles, and pages already open fail with "504 Outdated Optimize Dep",
    // leaving islands such as the Custom form blank. Dev only; has no effect on the production build.
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'motion/react', 'lucide-react', 'react-hook-form'],
    },
  },
});
