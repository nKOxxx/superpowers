import { describe, it, expect } from 'vitest';
import { 
  parseVersion, 
  bumpVersion, 
  validateBump,
  type VersionBump 
} from '../scripts/lib/version.js';

describe('version', () => {
  describe('parseVersion', () => {
    it('parses semantic version', () => {
      const result = parseVersion('1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined
      });
    });

    it('parses version with v prefix', () => {
      const result = parseVersion('v1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined
      });
    });

    it('parses version with prerelease', () => {
      const result = parseVersion('1.2.3-beta.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1'
      });
    });

    it('throws on invalid version', () => {
      expect(() => parseVersion('invalid')).toThrow('Invalid version format');
    });
  });

  describe('bumpVersion', () => {
    it('bumps patch version', () => {
      const result = bumpVersion('1.2.3', 'patch');
      expect(result).toBe('1.2.4');
    });

    it('bumps minor version', () => {
      const result = bumpVersion('1.2.3', 'minor');
      expect(result).toBe('1.3.0');
    });

    it('bumps major version', () => {
      const result = bumpVersion('1.2.3', 'major');
      expect(result).toBe('2.0.0');
    });

    it('uses explicit version', () => {
      const result = bumpVersion('1.2.3', '2.0.0');
      expect(result).toBe('2.0.0');
    });

    it('uses explicit version with v prefix', () => {
      const result = bumpVersion('1.2.3', 'v2.0.0');
      expect(result).toBe('2.0.0');
    });
  });

  describe('validateBump', () => {
    it('validates correct bump', () => {
      const result = validateBump('1.2.3', '1.2.4');
      expect(result.valid).toBe(true);
    });

    it('invalidates decreasing major', () => {
      const result = validateBump('2.0.0', '1.0.0');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Major version cannot decrease');
    });

    it('invalidates decreasing minor', () => {
      const result = validateBump('1.2.0', '1.1.0');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Minor version cannot decrease');
    });

    it('invalidates decreasing patch', () => {
      const result = validateBump('1.2.3', '1.2.2');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Patch version cannot decrease');
    });

    it('invalidates same version', () => {
      const result = validateBump('1.2.3', '1.2.3');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Version must be different from current');
    });
  });
});
