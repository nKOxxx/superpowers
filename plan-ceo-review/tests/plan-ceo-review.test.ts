import { describe, it, expect } from 'vitest';
import { PlanCeoReviewSkill } from '../src/index.js';

describe('PlanCeoReviewSkill', () => {
  it('should create a PlanCeoReviewSkill instance', () => {
    const skill = new PlanCeoReviewSkill();
    expect(skill).toBeDefined();
  });

  it('should calculate BAT scores', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({ 
      featureName: 'Test Feature' 
    });
    
    expect(result.batScore).toBeDefined();
    expect(result.batScore.brand).toBeGreaterThanOrEqual(0);
    expect(result.batScore.brand).toBeLessThanOrEqual(5);
    expect(result.batScore.total).toBeLessThanOrEqual(15);
  });

  it('should calculate 10-star scores', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({ 
      featureName: 'Test Feature' 
    });
    
    expect(result.tenStarScore).toBeDefined();
    expect(result.tenStarScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.tenStarScore.overall).toBeLessThanOrEqual(10);
  });

  it('should provide build vs buy analysis when requested', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({ 
      featureName: 'Test Feature',
      buildVsBuy: true
    });
    
    expect(result.buildVsBuy).toBeDefined();
    expect(['build', 'buy', 'hybrid']).toContain(result.buildVsBuy?.recommendation);
  });

  it('should provide recommendation', async () => {
    const skill = new PlanCeoReviewSkill();
    const result = await skill.review({ 
      featureName: 'Test Feature' 
    });
    
    expect(['BUILD', 'CONSIDER', "DON'T BUILD"]).toContain(result.batRecommendation);
  });
});
