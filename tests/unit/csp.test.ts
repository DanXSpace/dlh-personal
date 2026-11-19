import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scriptHash } from '../../src/lib/csp.ts';

test('scriptHash gives the CSP sha256 source expression for an inline script', () => {
  // Expected value from `printf 'alert(1)' | openssl dgst -sha256 -binary | base64`.
  assert.equal(scriptHash('alert(1)'), 'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI=');
});
