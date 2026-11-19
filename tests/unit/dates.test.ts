import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, isoDate } from '../../src/lib/dates.ts';

// Frontmatter dates such as `published: 2026-11-19` parse as UTC midnight.
const date = new Date('2026-11-19T00:00:00Z');

test('dates read like the design spec: month name, day, year', () => {
  assert.equal(formatDate(date), 'November 19, 2026');
});

test('a frontmatter date never shifts to the previous day in a timezone behind UTC', () => {
  const previous = process.env['TZ'];
  process.env['TZ'] = 'America/Jamaica';
  try {
    assert.equal(formatDate(new Date('2026-01-01T00:00:00Z')), 'January 1, 2026');
    assert.equal(isoDate(new Date('2026-01-01T00:00:00Z')), '2026-01-01');
  } finally {
    if (previous === undefined) delete process.env['TZ'];
    else process.env['TZ'] = previous;
  }
});

test('the machine-readable form is a plain calendar date for <time datetime>', () => {
  assert.equal(isoDate(date), '2026-11-19');
});
