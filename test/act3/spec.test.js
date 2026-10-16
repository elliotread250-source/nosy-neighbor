// Test 1: every dimension carries a valid tag, and the builder refuses
// untagged numbers with a message naming the exact path.
import { describe, it, expect } from 'vitest';
import { validateSpec, assertValid, SpecError } from '../../src/act3/Spec.js';
import { planHouse } from '../../src/act3/Plan.js';
import { houses, load } from './helpers.js';

describe('test 1: tagged dimensions', () => {
  for (const [name, spec] of houses()) {
    it(`${name}: no untagged numbers`, () => {
      expect(validateSpec(spec)).toEqual([]);
    });
  }
  it('refuses a plain number and names its path', () => {
    const spec = load('data/act3/test-house.json');
    spec.floors[0].ceiling = 3.4;
    expect(() => planHouse(spec)).toThrow(SpecError);
    try { assertValid(spec); } catch (e) { expect(e.message).toContain('house.floors[0].ceiling'); }
  });
  it('refuses an unknown tag', () => {
    const spec = load('data/act3/test-house.json');
    spec.floors[0].ceiling.tag = 'guessed';
    expect(validateSpec(spec).some((e) => e.message.includes('unknown tag'))).toBe(true);
  });
  it('refuses a value object without a tag', () => {
    const spec = load('data/act3/test-house.json');
    delete spec.floors[0].slab.tag;
    expect(validateSpec(spec).length).toBeGreaterThan(0);
  });
});
