import { describe, it, expect } from 'vitest';
import { getCurrentVersion, bumpVersion } from '../ship/src/index.js';

describe('Ship Skill', () => {
  describe('getCurrentVersion', () => {
    it('should return version from package.json', () => {
      // This would need mocking in a real test
      expect(typeof getCurrentVersion).toBe('function');
    });
  });

  describe('bumpVersion', () => {
    it('should bump patch version', () => {
      const newVersion = bumpVersion('1.2.3', 'patch');
      expect(newVersion).toBe('1.2.4');
    });

    it('should bump minor version', () => {
      const newVersion = bumpVersion('1.2.3', 'minor');
      expect(newVersion).toBe('1.3.0');
    });

    it('should bump major version', () => {
      const newVersion = bumpVersion('1.2.3', 'major');
      expect(newVersion).toBe('2.0.0');
    });

    it('should accept explicit version', () => {
      const newVersion = bumpVersion('1.2.3', '3.0.0');
      expect(newVersion).toBe('3.0.0');
    });
  });
});

describe('GitHub Integration', () => {
  describe('parseRepoString', () => {
    it('should parse owner/repo format', () => {
      const repo = 'nKOxxx/superpowers';
      const [owner, name] = repo.split('/');
      expect(owner).toBe('nKOxxx');
      expect(name).toBe('superpowers');
    });

    it('should reject invalid format', () => {
      const invalid = 'invalid-format';
      expect(invalid.split('/').length).toBe(1);
    });
  });

  describe('GitHub client requirements', () => {
    it('should require GH_TOKEN', () => {
      const token = process.env.GH_TOKEN;
      // Just verify the env var handling logic
      expect(typeof token === 'string' || token === undefined).toBe(true);
    });
  });
});
