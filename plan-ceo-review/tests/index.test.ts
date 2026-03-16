import { describe, it, expect } from 'vitest';
import { PlanCeoReviewSkill } from '../src/index.js';

describe('PlanCeoReviewSkill', () => {
  const skill = new PlanCeoReviewSkill();

  it('should review a feature', () => {
    const result = skill.review('Dark mode');
    expect(result.feature).toBe('Dark mode');
    expect(result.batScore.total).toBeGreaterThan(0);
    expect(result.batScore.total).toBeLessThanOrEqual(15);
    expect(result.starRating.overall).toBeGreaterThan(0);
    expect(result.starRating.overall).toBeLessThanOrEqual(10);
  });

  it('should compare two features', () => {
    const result = skill.compare('Feature A', 'Feature B');
    expect(result.feature1).toBeDefined();
    expect(result.feature2).toBeDefined();
  });

  it('should return framework info', () => {
    const framework = skill.getFramework();
    expect(framework.bat.dimensions).toHaveLength(3);
    expect(framework.tenStar.scale).toHaveLength(10);
  });
});
