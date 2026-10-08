import { describe, expect, test } from 'bun:test';

import { createTextPositionIndex } from './textPosition';

describe('createTextPositionIndex', () => {
  for (const { label, trailingNodes } of [
    { label: 'without a trailing newline', trailingNodes: [] },
    { label: 'with a trailing newline', trailingNodes: [{ data: '\n' }] },
  ]) {
    test(`maps a second-line match start to visible content ${label}`, () => {
      const firstLine = { data: 'output:' };
      const hiddenLineBreak = { data: '\n' };
      const secondLine = { data: 'src/index.ts:12' };
      const nodes = [firstLine, hiddenLineBreak, secondLine, ...trailingNodes];
      const startOffset = firstLine.data.length + hiddenLineBreak.data.length;
      const findPosition = createTextPositionIndex(nodes);

      expect(findPosition(startOffset, 'right')).toEqual({ node: secondLine, offset: 0 });
      expect(findPosition(startOffset + secondLine.data.length, 'left')).toEqual({
        node: secondLine,
        offset: secondLine.data.length,
      });
    });
  }

  test('keeps an end boundary on the preceding text node', () => {
    const firstLine = { data: 'src/index.ts:12' };
    const hiddenLineBreak = { data: '\n' };
    const findPosition = createTextPositionIndex([firstLine, hiddenLineBreak]);

    expect(findPosition(firstLine.data.length, 'left')).toEqual({
      node: firstLine,
      offset: firstLine.data.length,
    });
  });

  test('preserves zero-length nodes and out-of-range boundaries', () => {
    const empty = { data: '' };
    const text = { data: 'abc' };
    const trailing = { data: '' };
    const findPosition = createTextPositionIndex([empty, text, trailing]);

    expect(createTextPositionIndex([])(0, 'right')).toBeNull();
    expect(findPosition(0, 'left')).toEqual({ node: empty, offset: 0 });
    expect(findPosition(0, 'right')).toEqual({ node: text, offset: 0 });
    expect(findPosition(3, 'left')).toEqual({ node: text, offset: 3 });
    expect(findPosition(3, 'right')).toEqual({ node: trailing, offset: 0 });
    expect(findPosition(100, 'right')).toEqual({ node: trailing, offset: 0 });
    expect(findPosition(-1, 'left')).toEqual({ node: empty, offset: 0 });
  });

  test('returns the original node when adjacent nodes have identical text', () => {
    const first = { data: 'same' };
    const second = { data: 'same' };
    const findPosition = createTextPositionIndex([first, second]);

    expect(findPosition(4, 'left')?.node).toBe(first);
    expect(findPosition(4, 'right')?.node).toBe(second);
  });
});
