import { describe, it, expect } from 'vitest';
import { ceoReview } from '../src/index.js';

describe('ceo-review', () => {
  it('should be defined', () => {
    expect(ceoReview).toBeDefined();
    expect(typeof ceoReview).toBe('function');
  });
});
