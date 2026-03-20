/**
 * Plan CEO Review skill tests
 */

import { describe, it, expect } from 'vitest';
import { PlanCeoReviewSkill } from '../src/index.js';

describe('PlanCeoReviewSkill', () => {
  it('should initialize correctly', () => {
    const skill = new PlanCeoReviewSkill();
    expect(skill).toBeDefined();
  });

  it('should review a feature', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({
      featureName: 'Test Feature'
    });

    expect(result.featureName).toBe('Test Feature');
    expect(result.batScore).toBeDefined();
    expect(result.batScore.brand).toBeGreaterThanOrEqual(0);
    expect(result.batScore.brand).toBeLessThanOrEqual(5);
    expect(result.tenStarScore).toBeDefined();
    expect(result.batRecommendation).toBeDefined();
  });

  it('should generate build vs buy analysis', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({
      featureName: 'Authentication System',
      buildVsBuy: true
    });

    expect(result.buildVsBuy).toBeDefined();
    expect(result.buildVsBuy?.recommendation).toBeDefined();
  });

  it('should format results', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({
      featureName: 'Test Feature'
    });

    const formatted = skill.formatResult(result, 'summary');
    expect(formatted).toContain('BAT');
    expect(formatted).toContain(result.featureName);
  });
});