import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import { resolveContentSource } from './src/lib/content-source.ts';
import { scriptHash } from './src/lib/csp.ts';
import { THEME_INIT_SCRIPT } from './src/lib/theme.ts';
import { hastPlugins, shikiConfig } from './src/markdown/pipeline.ts';

const contentSource = resolveContentSource(process.env);

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  outDir: `./${contentSource.outDir}`,
  // Self-hosted at build time with generated, metric-matched fallbacks
  // (architecture §7.3). `<Font>` in BaseLayout preloads only the sans 400 file.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-geist-sans',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  // Astro 7's default Sätteri processor, extended with in-repo plugins for
  // heading anchors and scroll regions, and Shiki with CSP-safe token classes
  // (architecture §6, src/markdown/).
  markdown: {
    processor: satteri({ hastPlugins }),
    shikiConfig,
  },
  security: {
    // Astro emits the policy as a <meta> tag on every page and adds `script-src`
    // and `style-src` with hashes of the inline scripts and styles it renders, so
    // `'unsafe-inline'` is never needed. `frame-ancestors` is ignored in a <meta>
    // policy; framing is blocked by `X-Frame-Options` in `public/_headers`.
    csp: {
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Astro doesn't hash `is:inline` scripts, so the theme init script's hash is supplied here.
      scriptDirective: { hashes: [scriptHash(THEME_INIT_SCRIPT)] },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
