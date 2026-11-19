import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryIds } from '../../src/lib/content-ids.ts';

const base = 'src/content/writing';
const everyFileExists = () => true;

test('an entry folder with an index file takes the folder name as its slug', () => {
  const idFor = entryIds({ collection: 'writing', base, exists: everyFileExists });
  assert.equal(idFor({ entry: 'first-post/index.md' }), 'first-post');
});

test('a single-file entry takes its file name as its slug', () => {
  const idFor = entryIds({ collection: 'writing', base, exists: everyFileExists });
  assert.equal(idFor({ entry: 'second-post.md' }), 'second-post');
});

test('two files that resolve to the same slug fail with both file paths named', () => {
  const idFor = entryIds({ collection: 'writing', base, exists: everyFileExists });
  idFor({ entry: 'hello/index.md' });
  assert.throws(
    () => idFor({ entry: 'hello.md' }),
    (error: Error) => {
      assert.match(error.message, /Duplicate slug "hello" in the writing collection/);
      assert.match(error.message, /src\/content\/writing\/hello\/index\.md/);
      assert.match(error.message, /src\/content\/writing\/hello\.md/);
      return true;
    },
  );
});

test('the same file can be loaded again, as the dev server does after an edit', () => {
  const idFor = entryIds({ collection: 'writing', base, exists: everyFileExists });
  idFor({ entry: 'hello/index.md' });
  assert.equal(idFor({ entry: 'hello/index.md' }), 'hello');
});

test('a renamed file whose old path is gone is not a duplicate', () => {
  const gone = new Set(['src/content/writing/hello.md']);
  const idFor = entryIds({ collection: 'writing', base, exists: (path) => !gone.has(path) });
  idFor({ entry: 'hello.md' });
  assert.equal(idFor({ entry: 'hello/index.md' }), 'hello');
});

test('a file or folder name that is not a lowercase, hyphenated slug fails with a fix', () => {
  const idFor = entryIds({ collection: 'writing', base, exists: everyFileExists });
  for (const entry of ['My Post/index.md', 'my_post.md', 'Post.md', '-post.md']) {
    assert.throws(
      () => idFor({ entry }),
      (error: Error) => {
        assert.match(error.message, new RegExp(`src/content/writing/${entry.replace('.', '\\.')}`));
        assert.match(error.message, /lowercase letters, digits and single hyphens/);
        return true;
      },
      entry,
    );
  }
});
