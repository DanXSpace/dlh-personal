import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, fontProviders } from 'astro/config';
import type { AstroIntegration } from 'astro';
import { resolveContentSource } from './src/lib/content-source.ts';
import { scriptHash } from './src/lib/csp.ts';
import { searchIndex } from './src/lib/search-index.ts';
import { THEME_INIT_SCRIPT } from './src/lib/theme.ts';
import { hastPlugins, shikiConfig } from './src/markdown/pipeline.ts';
import { site } from './src/site.config.ts';

const contentSource = resolveContentSource(process.env);
const [publicDir, ...publicOverlays] = contentSource.publicDirs;

// Astro serves one public directory; later layers (fixture files such as a
// résumé PDF, ADR-0004) are copied over the finished build output.
const publicOverlay: AstroIntegration = {
  name: 'public-overlay',
  hooks: {
    'astro:build:done': ({ dir }) => {
      for (const overlay of publicOverlays) cpSync(overlay, fileURLToPath(dir), { recursive: true });
    },
  },
};

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Canonical URLs, social tags, the sitemap and RSS are built from this (architecture §10).
  site: site.origin,
  output: 'static',
  outDir: `./${contentSource.outDir}`,
  publicDir: `./${publicDir}`,
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
  // `.mdx` entries inherit the Markdown pipeline above, so both render alike.
  // The sitemap lists every built route; drafts are never built in production
  // (architecture §5.5), and the 404 page is left out by the integration.
  // `searchIndex` writes the Pagefind index for the palette's full-text search
  // into this build's output (architecture §9).
  integrations: [mdx(), sitemap(), publicOverlay, searchIndex()],
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
