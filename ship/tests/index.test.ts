import { describe, it, expect } from 'vitest';
import { ShipSkill } from '../src/index.js';

describe('ShipSkill', () => {
  const skill = new ShipSkill();

  it('should initialize with default config', () => {
    const config = skill.getConfig();
    expect(config.defaultBump).toBe('patch');
    expect(config.tagPrefix).toBe('v');
  });
});
