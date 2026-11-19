import { createHash } from 'node:crypto';

/**
 * The CSP source expression for an inline script. Astro hashes the scripts it
 * processes but not `<script is:inline>`, so those hashes are supplied through
 * `security.csp.scriptDirective.hashes` (ticket 02).
 */
export function scriptHash(source: string): `sha256-${string}` {
  return `sha256-${createHash('sha256').update(source).digest('base64')}`;
}
