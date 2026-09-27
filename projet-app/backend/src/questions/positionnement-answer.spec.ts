import { isPositionnementAnswerCorrect, stripAnswerKey } from './positionnement-answer';

describe('isPositionnementAnswerCorrect', () => {
  const qcm = { responseType: 'qcm', options: ['a', 'b', 'c'], correctResponseIndex: 1 } as any;
  const multi = { responseType: 'checkbox', options: ['x', 'y', 'z'], correctResponseIndexes: [0, 2] } as any;

  it('checks single-choice answers by option text', () => {
    expect(isPositionnementAnswerCorrect(qcm, 'b')).toBe(true);
    expect(isPositionnementAnswerCorrect(qcm, 'a')).toBe(false);
    expect(isPositionnementAnswerCorrect(qcm, undefined)).toBe(false);
  });

  it('requires the exact set of options for multi-select, in any order', () => {
    expect(isPositionnementAnswerCorrect(multi, ['z', 'x'])).toBe(true);
    expect(isPositionnementAnswerCorrect(multi, ['x'])).toBe(false);
    expect(isPositionnementAnswerCorrect(multi, ['x', 'y', 'z'])).toBe(false);
    expect(isPositionnementAnswerCorrect(multi, 'x')).toBe(false);
  });

  it('treats metadata multi_select like checkbox', () => {
    const q = { ...multi, responseType: 'qcm', metadata: { type: 'multi_select' } };
    expect(isPositionnementAnswerCorrect(q, ['x', 'z'])).toBe(true);
  });

  it('returns false for an out-of-range answer key instead of matching undefined', () => {
    expect(isPositionnementAnswerCorrect({ ...qcm, correctResponseIndex: 9 }, undefined)).toBe(false);
  });
});

describe('stripAnswerKey', () => {
  it('removes answer keys and keeps the rest', () => {
    const stripped = stripAnswerKey({ id: 1, text: 'Q', correctResponseIndex: 0, correctResponseIndexes: [0] } as any);
    expect(stripped).toEqual({ id: 1, text: 'Q' });
  });
});
