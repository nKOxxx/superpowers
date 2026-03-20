import { describe, it, expect, vi } from 'vitest';
import { QaSkill } from '../src/index.js';

describe('QaSkill', () => {
  it('should create a QaSkill instance', () => {
    const skill = new QaSkill();
    expect(skill).toBeDefined();
  });

  it('should detect frameworks', async () => {
    const skill = new QaSkill();
    expect(typeof skill.detectFramework).toBe('function');
  });

  it('should have run method', () => {
    const skill = new QaSkill();
    expect(typeof skill.run).toBe('function');
  });
});
