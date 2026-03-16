import { describe, it, expect } from 'vitest';
import { QaSkill } from '../src/index.js';

describe('QaSkill', () => {
  const skill = new QaSkill();

  it('should initialize with default config', () => {
    const config = skill.getConfig();
    expect(config.defaultRunner).toBe('vitest');
    expect(config.coverageThreshold).toBe(80);
  });

  it('should detect test runner', async () => {
    const runner = await skill.detectRunner();
    expect(['vitest', 'jest', 'playwright', 'mocha']).toContain(runner);
  });
});
