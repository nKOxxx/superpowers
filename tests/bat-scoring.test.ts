import { describe, it, expect } from 'vitest';
import {
  validateScore,
  calculateTotal,
  getRecommendation,
  getStars,
  evaluateBAT,
  formatBATEvaluation,
  type BATDimension
} from '../scripts/lib/bat-scoring.js';

describe('bat-scoring', () => {
  describe('validateScore', () => {
    it('accepts valid scores', () => {
      expect(() => validateScore(0)).not.toThrow();
      expect(() => validateScore(3)).not.toThrow();
      expect(() => validateScore(5)).not.toThrow();
    });

    it('rejects negative scores', () => {
      expect(() => validateScore(-1)).toThrow('integer between 0 and 5');
    });

    it('rejects scores above 5', () => {
      expect(() => validateScore(6)).toThrow('integer between 0 and 5');
    });

    it('rejects decimal scores', () => {
      expect(() => validateScore(3.5)).toThrow('integer between 0 and 5');
    });
  });

  describe('calculateTotal', () => {
    it('calculates total correctly', () => {
      const scores = { brand: 4, attention: 5, trust: 3 };
      expect(calculateTotal(scores)).toBe(12);
    });

    it('handles all zeros', () => {
      const scores = { brand: 0, attention: 0, trust: 0 };
      expect(calculateTotal(scores)).toBe(0);
    });

    it('handles all fives', () => {
      const scores = { brand: 5, attention: 5, trust: 5 };
      expect(calculateTotal(scores)).toBe(15);
    });
  });

  describe('getRecommendation', () => {
    it('recommends build for 12+', () => {
      expect(getRecommendation(12)).toBe('build');
      expect(getRecommendation(15)).toBe('build');
    });

    it('recommends build for 10-11 with default threshold', () => {
      expect(getRecommendation(10)).toBe('build');
      expect(getRecommendation(11)).toBe('build');
    });

    it('recommends consider for 8-9', () => {
      expect(getRecommendation(8)).toBe('consider');
      expect(getRecommendation(9)).toBe('consider');
    });

    it('recommends dont-build for < 8', () => {
      expect(getRecommendation(7)).toBe('dont-build');
      expect(getRecommendation(0)).toBe('dont-build');
    });

    it('respects custom minimum score', () => {
      expect(getRecommendation(9, 10)).toBe('consider');
      expect(getRecommendation(10, 10)).toBe('build');
    });
  });

  describe('getStars', () => {
    it('returns correct star strings', () => {
      expect(getStars(5)).toBe('⭐⭐⭐⭐⭐⚫⚫⚫⚫⚫⚫');
      expect(getStars(3)).toBe('⭐⭐⭐⚫⚫⚫⚫⚫⚫⚫');
      expect(getStars(0)).toBe('⚫⚫⚫⚫⚫⚫⚫⚫⚫⚫');
    });
  });

  describe('evaluateBAT', () => {
    it('evaluates high-scoring feature', () => {
      const result = evaluateBAT(
        'Dark Mode',
        'Reduce eye strain',
        { brand: 4, attention: 5, trust: 4 },
        'Developer Tools'
      );

      expect(result.feature).toBe('Dark Mode');
      expect(result.goal).toBe('Reduce eye strain');
      expect(result.market).toBe('Developer Tools');
      expect(result.totalScore).toBe(13);
      expect(result.recommendation).toBe('build');
    });

    it('evaluates low-scoring feature', () => {
      const result = evaluateBAT(
        'Animated Backgrounds',
        'Visual appeal',
        { brand: 2, attention: 2, trust: 1 }
      );

      expect(result.totalScore).toBe(5);
      expect(result.recommendation).toBe('dont-build');
    });

    it('includes rationale for strengths', () => {
      const result = evaluateBAT(
        'Test Feature',
        'Test goal',
        { brand: 5, attention: 3, trust: 3 }
      );

      expect(result.rationale.some(r => r.includes('Strongest in Brand'))).toBe(true);
      expect(result.rationale.some(r => r.includes('High engagement'))).toBe(false);
    });

    it('includes rationale for weaknesses', () => {
      const result = evaluateBAT(
        'Test Feature',
        'Test goal',
        { brand: 3, attention: 2, trust: 3 }
      );

      expect(result.rationale.some(r => r.includes('Weakness in Attention'))).toBe(true);
    });

    it('respects requireAllBAT option', () => {
      const result = evaluateBAT(
        'Test Feature',
        'Test goal',
        { brand: 5, attention: 5, trust: 5 },
        undefined,
        { requireAllBAT: true }
      );

      expect(result.recommendation).toBe('build');
    });
  });

  describe('formatBATEvaluation', () => {
    it('formats evaluation with all fields', () => {
      const evaluation = evaluateBAT(
        'Mobile App',
        'Increase engagement',
        { brand: 4, attention: 5, trust: 4 },
        'SaaS'
      );

      const formatted = formatBATEvaluation(evaluation);

      expect(formatted).toContain('CEO Review: Mobile App');
      expect(formatted).toContain('Goal: Increase engagement');
      expect(formatted).toContain('Market: SaaS');
      expect(formatted).toContain('Total: 13/15');
      expect(formatted).toContain('BUILD');
    });

    it('formats without market', () => {
      const evaluation = evaluateBAT(
        'Feature',
        'Goal',
        { brand: 3, attention: 3, trust: 3 }
      );

      const formatted = formatBATEvaluation(evaluation);

      expect(formatted).toContain('CEO Review: Feature');
      expect(formatted).not.toContain('Market:');
    });
  });
});
