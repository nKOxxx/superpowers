import { describe, it, expect } from 'vitest';
import { ceoReview, calculateRecommendation, generateReasoning, generateNextSteps } from '../plan-ceo-review/src/index.js';

describe('BAT Framework', () => {
  describe('ceoReview', () => {
    it('should calculate total score correctly', () => {
      const result = ceoReview({ feature: 'Test Feature', brand: 4, attention: 3, trust: 5 });
      expect(result.scores.brand).toBe(4);
      expect(result.scores.attention).toBe(3);
      expect(result.scores.trust).toBe(5);
      expect(result.totalScore).toBe(12);
    });

    it('should recommend BUILD for scores >= 12', () => {
      const result = ceoReview({ feature: 'Test Feature', brand: 4, attention: 4, trust: 4 });
      expect(result.totalScore).toBeGreaterThanOrEqual(12);
      expect(result.recommendation).toBe('BUILD');
    });

    it('should recommend CONSIDER for scores 8-11', () => {
      const result = ceoReview({ feature: 'Test Feature', brand: 3, attention: 3, trust: 2 });
      expect(result.totalScore).toBe(8);
      expect(result.recommendation).toBe('CONSIDER');
    });

    it('should recommend DON\'T BUILD for scores < 8', () => {
      const result = ceoReview({ feature: 'Test Feature', brand: 1, attention: 2, trust: 1 });
      expect(result.totalScore).toBe(4);
      expect(result.recommendation).toBe("DON'T BUILD");
    });
  });

  describe('calculateRecommendation', () => {
    it('returns BUILD for 12+', () => {
      expect(calculateRecommendation(15)).toBe('BUILD');
      expect(calculateRecommendation(12)).toBe('BUILD');
    });

    it('returns CONSIDER for 8-11', () => {
      expect(calculateRecommendation(10)).toBe('CONSIDER');
      expect(calculateRecommendation(8)).toBe('CONSIDER');
    });

    it('returns DON\'T BUILD for < 8', () => {
      expect(calculateRecommendation(7)).toBe("DON'T BUILD");
      expect(calculateRecommendation(0)).toBe("DON'T BUILD");
    });
  });

  describe('generateReasoning', () => {
    it('should generate reasoning for high scores', () => {
      const reasoning = generateReasoning({ brand: 5, attention: 5, trust: 5 }, 15);
      expect(reasoning).toContain('Strong brand');
      expect(reasoning).toContain('High attention');
      expect(reasoning).toContain('Strong trust');
    });

    it('should generate reasoning for low scores', () => {
      const reasoning = generateReasoning({ brand: 1, attention: 1, trust: 1 }, 3);
      expect(reasoning).toContain('Weak brand');
      expect(reasoning).toContain('Low attention');
      expect(reasoning).toContain('Trust risk');
    });
  });

  describe('generateNextSteps', () => {
    it('should generate BUILD steps', () => {
      const steps = generateNextSteps('BUILD', 'Feature');
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toContain('Prioritize');
    });

    it('should generate CONSIDER steps', () => {
      const steps = generateNextSteps('CONSIDER', 'Feature');
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toContain('research');
    });

    it('should generate DON\'T BUILD steps', () => {
      const steps = generateNextSteps("DON'T BUILD", 'Feature');
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toContain('Document');
    });
  });
});
