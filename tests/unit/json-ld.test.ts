import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blogPosting,
  breadcrumbList,
  caseStudy,
  identityNodes,
  jsonLdScript,
} from '../../src/lib/json-ld.ts';

const origin = 'https://example.com';
const author = { '@type': 'Person', '@id': 'https://example.com/#person', name: 'Daniel Lee Holung', url: 'https://example.com/' };

test('the homepage and About page describe the person and the website', () => {
  for (const path of ['/', '/about', '/about/']) {
    assert.deepEqual(
      identityNodes(path, origin, []),
      [
        { '@type': 'Person', '@id': 'https://example.com/#person', name: 'Daniel Lee Holung', url: 'https://example.com/' },
        {
          '@type': 'WebSite',
          '@id': 'https://example.com/#website',
          name: 'Daniel Lee Holung',
          url: 'https://example.com/',
          author: { '@id': 'https://example.com/#person' },
        },
      ],
      path,
    );
  }
});

test('other pages carry no person or website data', () => {
  for (const path of ['/work', '/writing/an-article', '/about/more', '/now']) {
    assert.deepEqual(identityNodes(path, origin, []), [], path);
  }
});

test('the person lists approved profile links, and only those, as sameAs', () => {
  const [person] = identityNodes('/', origin, ['https://github.com/someone']);
  assert.deepEqual(person?.['sameAs'], ['https://github.com/someone']);
});

test('an article is a BlogPosting by the site author, dated in full ISO form', () => {
  assert.deepEqual(
    blogPosting(
      {
        title: 'An article',
        description: 'What it is about.',
        published: new Date('2026-03-14'),
        updated: new Date('2026-04-02'),
        path: '/writing/an-article',
        image: '/social/default.png',
      },
      origin,
    ),
    {
      '@type': 'BlogPosting',
      headline: 'An article',
      description: 'What it is about.',
      datePublished: '2026-03-14T00:00:00.000Z',
      dateModified: '2026-04-02T00:00:00.000Z',
      url: 'https://example.com/writing/an-article/',
      mainEntityOfPage: 'https://example.com/writing/an-article/',
      image: 'https://example.com/social/default.png',
      author,
    },
  );
});

test('an article never updated is modified on its publication date', () => {
  const posting = blogPosting(
    { title: 'A', description: 'B', published: new Date('2026-03-14'), path: '/writing/a', image: '/x.png' },
    origin,
  );
  assert.equal(posting['dateModified'], '2026-03-14T00:00:00.000Z');
});

test('a project with a repository is SoftwareSourceCode linking the repository', () => {
  assert.deepEqual(
    caseStudy(
      {
        title: 'A project',
        summary: 'What it does.',
        path: '/work/a-project',
        image: '/_astro/cover.jpg',
        repo: 'https://github.com/someone/a-project',
      },
      origin,
    ),
    {
      '@type': 'SoftwareSourceCode',
      name: 'A project',
      description: 'What it does.',
      url: 'https://example.com/work/a-project/',
      image: 'https://example.com/_astro/cover.jpg',
      codeRepository: 'https://github.com/someone/a-project',
      author,
    },
  );
});

test('a project without a repository is a CreativeWork', () => {
  const work = caseStudy({ title: 'A', summary: 'B', path: '/work/a', image: '/x.png' }, origin);
  assert.equal(work['@type'], 'CreativeWork');
  assert.equal('codeRepository' in work, false);
});

test('breadcrumbs number each step from Home to the current page, at canonical URLs', () => {
  assert.deepEqual(
    breadcrumbList(
      [
        { label: 'Writing', href: '/writing' },
        { label: 'An article', href: '/writing/an-article' },
      ],
      origin,
    ),
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
        { '@type': 'ListItem', position: 2, name: 'Writing', item: 'https://example.com/writing/' },
        { '@type': 'ListItem', position: 3, name: 'An article', item: 'https://example.com/writing/an-article/' },
      ],
    },
  );
});

test('the script body puts every node in one schema.org graph', () => {
  const body = jsonLdScript([{ '@type': 'Thing', name: 'One' }, { '@type': 'Thing', name: 'Two' }]);
  assert.deepEqual(JSON.parse(body), {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Thing', name: 'One' },
      { '@type': 'Thing', name: 'Two' },
    ],
  });
});

test('the script body cannot close its script element early, whatever the content says', () => {
  const body = jsonLdScript([{ '@type': 'Thing', name: '</script><script>alert(1)</script>' }]);
  assert.equal(body.includes('<'), false);
  assert.equal(JSON.parse(body)['@graph'][0].name, '</script><script>alert(1)</script>');
});
