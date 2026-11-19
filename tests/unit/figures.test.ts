import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figureLabel } from '../../src/lib/figures.ts';

test('a figure caption takes the spec form, with a two-digit number and an uppercase label', () => {
  assert.equal(figureLabel(1, 'Roots'), 'FIG. 01 / ROOTS');
  assert.equal(figureLabel(12, 'blue mountains'), 'FIG. 12 / BLUE MOUNTAINS');
});

test('numbers past 99 keep all their digits', () => {
  assert.equal(figureLabel(100, 'Roots'), 'FIG. 100 / ROOTS');
});

test('surrounding whitespace in the label is dropped', () => {
  assert.equal(figureLabel(3, '  Roots '), 'FIG. 03 / ROOTS');
});

test('a number that is not a positive whole number fails the build with a fix', () => {
  for (const number of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => figureLabel(number, 'Roots'), /positive whole number/, String(number));
  }
});

test('an empty label fails the build with a fix', () => {
  for (const label of ['', '   ']) {
    assert.throws(() => figureLabel(1, label), /needs a short label/);
  }
});
