import { describe, it, expect, vi } from 'vitest';
import { parseRepoString, createGitHubClient } from '../src/lib/github.js';

describe('GitHub Library', () => {
  describe('parseRepoString', () => {
    it('should parse owner/repo format', () => {
      const result = parseRepoString('nKOxxx/superpowers');
      expect(result.owner).toBe('nKOxxx');
      expect(result.repo).toBe('superpowers');
    });

    it('should throw on invalid format', () => {
      expect(() => parseRepoString('invalid')).toThrow('Invalid repo format');
      expect(() => parseRepoString('too/many/parts')).toThrow('Invalid repo format');
    });
  });

  describe('createGitHubClient', () => {
    it('should throw when GH_TOKEN is not set', () => {
      const originalToken = process.env.GH_TOKEN;
      delete process.env.GH_TOKEN;
      
      expect(() => createGitHubClient()).toThrow('GH_TOKEN environment variable is required');
      
      if (originalToken) {
        process.env.GH_TOKEN = originalToken;
      }
    });
  });
});
