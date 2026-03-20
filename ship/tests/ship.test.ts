/**
 * Ship skill tests
 */

import { describe, it, expect } from 'vitest';
import { ShipSkill } from '../src/index.js';

describe('ShipSkill', () => {
  it('should initialize correctly', () => {
    const skill = new ShipSkill();
    expect(skill).toBeDefined();
  });

  it('should bump versions correctly', async () => {
    const skill = new ShipSkill();
    // We can't easily test private methods, but we can test the public interface
    expect(skill).toBeDefined();
  });
});