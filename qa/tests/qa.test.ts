/**
 * QA skill tests
 */

import { describe, it, expect } from 'vitest';
import { QaSkill } from '../src/index.js';

describe('QaSkill', () => {
  it('should initialize correctly', () => {
    const skill = new QaSkill();
    expect(skill).toBeDefined();
  });

  it('should detect framework from empty dir as unknown', async () => {
    const skill = new QaSkill('/tmp/nonexistent');
    const framework = await skill.detectFramework();
    expect(framework).toBe('unknown');
  });
});