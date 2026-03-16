import { describe, it, expect } from 'vitest';
import { qa } from '../src/index.js';

describe('qa', () => {
  it('should be defined', () => {
    expect(qa).toBeDefined();
    expect(typeof qa).toBe('function');
  });
});
