import { describe, it, expect } from 'vitest';
import { ShipSkill } from '../src/index.js';

describe('ShipSkill', () => {
  it('should be defined', () => {
    const skill = new ShipSkill();
    expect(skill).toBeDefined();
    expect(typeof skill.release).toBe('function');
    expect(typeof skill.getStatus).toBe('function');
    expect(typeof skill.preview).toBe('function');
  });
});
