import { defineConfig } from 'astro/config';
import { resolveContentSource } from './src/lib/content-source.ts';

const contentSource = resolveContentSource(process.env);

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  outDir: `./${contentSource.outDir}`,
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
    },
  },
});
