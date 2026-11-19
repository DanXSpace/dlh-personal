import { defineConfig } from 'astro/config';
import { resolveContentSource } from './src/lib/content-source.ts';

const contentSource = resolveContentSource(process.env);

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  outDir: `./${contentSource.outDir}`,
});
