import { describe, it, expect } from 'vitest';
import { ship } from '../src/index.js';

describe('ship', () => {
  it('should be defined', () => {
    expect(ship).toBeDefined();
    expect(typeof ship).toBe('function');
  });
});
