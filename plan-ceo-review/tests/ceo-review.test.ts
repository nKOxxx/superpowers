import { describe, it, expect } from 'vitest';
import { PlanCeoReviewSkill } from '../src/index.js';

describe('PlanCeoReviewSkill', () => {
  const skill = new PlanCeoReviewSkill();

  it('should be defined', () => {
    expect(skill).toBeDefined();
    expect(typeof skill.review).toBe('function');
    expect(typeof skill.compare).toBe('function');
    expect(typeof skill.getFramework).toBe('function');
  });

  it('should review a feature', () => {
    const result = skill.review('AI Assistant');
    expect(result.feature).toBe('AI Assistant');
    expect(result.batScore).toBeDefined();
    expect(result.starRating).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  it('should compare two features', () => {
    const result = skill.compare('Feature A', 'Feature B');
    expect(result.feature1).toBeDefined();
    expect(result.feature2).toBeDefined();
  });
});
