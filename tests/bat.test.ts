import { describe, it, expect } from 'vitest';
import { calculateBATScore, formatStarRating } from '../src/lib/bat.js';

describe('BAT Framework', () => {
  describe('calculateBATScore', () => {
    it('should calculate total score correctly', () => {
      const result = calculateBATScore('Test Feature', 4, 3, 5);
      expect(result.score.brand).toBe(4);
      expect(result.score.attention).toBe(3);
      expect(result.score.trust).toBe(5);
      expect(result.total).toBe(12);
    });

    it('should clamp scores to 0-5 range', () => {
      const result = calculateBATScore('Test Feature', 10, -3, 3);
      expect(result.score.brand).toBe(5);
      expect(result.score.attention).toBe(0);
      expect(result.score.trust).toBe(3);
    });

    it('should recommend BUILD for scores >= 10', () => {
      const result = calculateBATScore('Test Feature', 4, 3, 5);
      expect(result.total).toBeGreaterThanOrEqual(10);
      expect(result.recommendation).toBe('BUILD');
    });

    it('should recommend CONSIDER for scores 7-9', () => {
      const result = calculateBATScore('Test Feature', 3, 2, 3);
      expect(result.total).toBe(8);
      expect(result.recommendation).toBe('CONSIDER');
    });

    it('should recommend DONT_BUILD for scores < 7', () => {
      const result = calculateBATScore('Test Feature', 1, 2, 1);
      expect(result.total).toBe(4);
      expect(result.recommendation).toBe('DONT_BUILD');
    });
  });

  describe('formatStarRating', () => {
    it('should return correct star string', () => {
      expect(formatStarRating(5)).toBe('⭐⭐⭐⭐⭐');
      expect(formatStarRating(3)).toBe('⭐⭐⭐⬜⬜');
      expect(formatStarRating(0)).toBe('⬜⬜⬜⬜⬜');
    });
  });
});
