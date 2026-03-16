import { describe, it, expect } from 'vitest';
import { browse, flow } from '../src/index.js';

describe('browse', () => {
  it('should be defined', () => {
    expect(browse).toBeDefined();
    expect(typeof browse).toBe('function');
  });

  it('should be defined for flow', () => {
    expect(flow).toBeDefined();
    expect(typeof flow).toBe('function');
  });
});
