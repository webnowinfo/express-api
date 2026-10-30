import { describe, test, expect } from '@jest/globals';
import { formatIdList, parseIdList } from '../../../src/utils/idList';

describe('parseIdList', () => {
  test.each([
    ['1,5,12', [1, 5, 12]],
    [' 1, 5 ,12 ', [1, 5, 12]],
    ['1;5;12', [1, 5, 12]],
    ['[1,5,12]', [1, 5, 12]],
    ['["1","5","12"]', [1, 5, 12]],
    ['1,,5,', [1, 5]],
    ['1,abc,-2,3.5,5', [1, 5]],
    ['5,1,5', [5, 1]],
    ['', []],
    ['[]', []]
  ])('parses %j', (raw, expected) => {
    expect(parseIdList(raw)).toEqual(expected);
  });

  test('treats null and undefined as empty', () => {
    expect(parseIdList(null)).toEqual([]);
    expect(parseIdList(undefined)).toEqual([]);
  });
});

describe('formatIdList', () => {
  test('writes comma-separated without duplicates', () => {
    expect(formatIdList([1, 5, 12, 5])).toBe('1,5,12');
    expect(formatIdList([])).toBe('');
  });
});
