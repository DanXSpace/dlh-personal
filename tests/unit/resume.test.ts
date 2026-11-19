import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resumeAccess, resumeLinks, resumePdfPresent } from '../../src/lib/resume.ts';

const noLinks = { email: '', github: '', linkedin: '' };

test('a hosted PDF makes the résumé downloadable from /resume.pdf', () => {
  assert.deepEqual(resumeAccess(true, noLinks), { kind: 'pdf', href: '/resume.pdf' });
});

test('without a PDF the résumé is on request, through the supplied email and LinkedIn links', () => {
  assert.deepEqual(
    resumeAccess(false, {
      email: 'hello@example.com',
      github: 'https://github.com/example',
      linkedin: 'https://www.linkedin.com/in/example',
    }),
    {
      kind: 'on-request',
      contacts: [
        { label: 'Email', href: 'mailto:hello@example.com' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/example' },
      ],
    },
  );
});

const resumePage = [{ label: 'Résumé', href: '/resume' }];

test('the rest of the site links to the résumé page once the PDF is hosted', () => {
  assert.deepEqual(resumeLinks(resumeAccess(true, noLinks)), resumePage);
});

test('without a PDF, the rest of the site still links to the résumé page once a contact link can request it', () => {
  assert.deepEqual(resumeLinks(resumeAccess(false, { ...noLinks, email: 'hello@example.com' })), resumePage);
  assert.deepEqual(
    resumeLinks(resumeAccess(false, { ...noLinks, linkedin: 'https://www.linkedin.com/in/example' })),
    resumePage,
  );
});

test('with neither a PDF nor a contact link, nothing else links to the résumé page', () => {
  assert.deepEqual(resumeLinks(resumeAccess(false, noLinks)), []);
  // GitHub is a profile, not a way to ask for the résumé.
  assert.deepEqual(resumeLinks(resumeAccess(false, { ...noLinks, github: 'https://github.com/example' })), []);
});

test('the PDF counts as present when any public layer holds resume.pdf', () => {
  const root = mkdtempSync(join(tmpdir(), 'resume-'));
  const [base, overlay] = [join(root, 'public'), join(root, 'overlay')];
  mkdirSync(base);
  mkdirSync(overlay);
  writeFileSync(join(base, 'other.pdf'), '');
  assert.equal(resumePdfPresent([base, overlay]), false);
  assert.equal(resumePdfPresent([base, join(root, 'missing')]), false);

  writeFileSync(join(overlay, 'resume.pdf'), '%PDF-1.4');
  assert.equal(resumePdfPresent([base, overlay]), true);
  assert.equal(resumePdfPresent([base]), false);
});
