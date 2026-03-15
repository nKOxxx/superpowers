import { describe, it, expect } from 'vitest';
import { formatDuration, formatBytes } from '../src/lib/format.js';

describe('Format Library', () => {
  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(2500)).toBe('2.5s');
      expect(formatDuration(5000)).toBe('5.0s');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500B');
      expect(formatBytes(1023)).toBe('1023B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0KB');
      expect(formatBytes(1536)).toBe('1.5KB');
      expect(formatBytes(1024 * 1023)).toBe('1023.0KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0MB');
      expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5MB');
    });
  });
});
