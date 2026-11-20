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
      paragraphs: ['Fixture invitation sentence.'],
      links: [{ label: 'GitHub', href: 'https://github.com/example' }],
    },
  );
});

test('the contact invitation keeps a list of paragraphs in order', () => {
  assert.deepEqual(contactInvitation({ ...noLinks, email: 'hello@example.com' }, ['First.', 'Second.'])?.paragraphs, [
    'First.',
    'Second.',
  ]);
});

test('set links still get an invitation when the content has no sentence for it', () => {
  assert.deepEqual(contactInvitation({ ...noLinks, email: 'hello@example.com' }, undefined), {
    paragraphs: [],
    links: [{ label: 'Email', href: 'mailto:hello@example.com' }],
  });
});
