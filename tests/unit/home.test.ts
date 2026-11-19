import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroActions, recentWriting, sectionNumbers, selectedWork } from '../../src/lib/home.ts';

function project(id: string, featured: boolean, year: number, order?: number) {
  return { id, data: { title: id, featured, year, order } };
}

test('selected work is the featured projects in directory order, at most three', () => {
  const selected = selectedWork([
    project('not-featured', false, 2026),
    project('newest', true, 2026),
    project('pinned', true, 2019, 1),
    project('older', true, 2024),
    project('oldest', true, 2021),
  ]);
  assert.deepEqual(
    selected.map((entry) => entry.id),
    ['pinned', 'newest', 'older'],
  );
});

test('with no featured projects there is no selected work', () => {
  assert.deepEqual(selectedWork([project('not-featured', false, 2026)]), []);
});

function article(id: string, published: string) {
  return { id, data: { published: new Date(published) } };
}

test('recent writing is the three newest articles, newest first', () => {
  const recent = recentWriting([
    article('oldest', '2025-11-03'),
    article('newest', '2026-05-20'),
    article('second', '2026-03-14'),
    article('third', '2026-02-01'),
  ]);
  assert.deepEqual(
    recent.map((entry) => entry.id),
    ['newest', 'second', 'third'],
  );
});

const noLinks = { email: '', github: '', linkedin: '' };

test('the hero offers “Explore my work” once a project is published, then GitHub and the résumé when available', () => {
  const actions = heroActions({
    hasProjects: true,
    links: { email: 'me@example.com', github: 'https://github.com/example', linkedin: 'https://linkedin.com/in/example' },
    resume: [{ label: 'Résumé', href: '/resume' }],
  });
  assert.deepEqual(actions, {
    primary: { label: 'Explore my work', href: '/work' },
    secondary: [
      { label: 'GitHub', href: 'https://github.com/example' },
      { label: 'Résumé', href: '/resume' },
    ],
  });
});

test('the hero offers no action that would lead nowhere', () => {
  assert.deepEqual(heroActions({ hasProjects: false, links: noLinks, resume: [] }), {
    primary: undefined,
    secondary: [],
  });
});

test('with every section shown, the sections are numbered 1, 2 and 3 in page order', () => {
  assert.deepEqual(sectionNumbers({ selectedWork: true, recentWriting: true, inThePresent: true }), {
    selectedWork: 1,
    recentWriting: 2,
    inThePresent: 3,
  });
});

test('a section left out gets no number and leaves no gap in the numbering', () => {
  assert.deepEqual(sectionNumbers({ selectedWork: false, recentWriting: true, inThePresent: true }), {
    recentWriting: 1,
    inThePresent: 2,
  });
  assert.deepEqual(sectionNumbers({ selectedWork: true, recentWriting: false, inThePresent: true }), {
    selectedWork: 1,
    inThePresent: 2,
  });
  assert.deepEqual(sectionNumbers({ selectedWork: false, recentWriting: false, inThePresent: false }), {});
});
