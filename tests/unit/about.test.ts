import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactInvitation } from '../../src/lib/about.ts';

const noLinks = { email: '', github: '', linkedin: '' };

test('the contact invitation is omitted while no contact or professional link is set', () => {
  assert.equal(contactInvitation(noLinks, 'Fixture invitation sentence.'), undefined);
  assert.equal(contactInvitation(noLinks, undefined), undefined);
});

test('the contact invitation offers only the links set in site config, with its sentence', () => {
  assert.deepEqual(
    contactInvitation({ ...noLinks, github: 'https://github.com/example' }, 'Fixture invitation sentence.'),
    {
      text: 'Fixture invitation sentence.',
      links: [{ label: 'GitHub', href: 'https://github.com/example' }],
    },
  );
});

test('set links still get an invitation when the content has no sentence for it', () => {
  assert.deepEqual(contactInvitation({ ...noLinks, email: 'hello@example.com' }, undefined), {
    text: undefined,
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }],
  });
});
