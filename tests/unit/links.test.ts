import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleLinks } from '../../src/lib/links.ts';

test('no links render while every contact and professional field is empty', () => {
  assert.deepEqual(visibleLinks({ email: '', github: '', linkedin: '' }), []);
});

test('set fields render as labeled links in a fixed order, with email as a mailto link', () => {
  assert.deepEqual(
    visibleLinks({
      linkedin: 'https://www.linkedin.com/in/example',
      github: 'https://github.com/example',
      email: 'hello@example.com',
    }),
    [
      { label: 'Email', href: 'mailto:hello@example.com' },
      { label: 'GitHub', href: 'https://github.com/example' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/example' },
    ],
  );
});

test('only the set fields render', () => {
  assert.deepEqual(visibleLinks({ email: '', github: 'https://github.com/example', linkedin: '' }), [
    { label: 'GitHub', href: 'https://github.com/example' },
  ]);
});

test('a whitespace-only value counts as empty, and set values are trimmed', () => {
  assert.deepEqual(visibleLinks({ email: '  ', github: ' https://github.com/example\n', linkedin: '\t' }), [
    { label: 'GitHub', href: 'https://github.com/example' },
  ]);
});
