import { describe, it, expect, vi } from 'vitest';
import { BrowseSkill } from '../src/index.js';

describe('BrowseSkill', () => {
  it('should create a BrowseSkill instance', () => {
    const skill = new BrowseSkill();
    expect(skill).toBeDefined();
  });

  it('should have required methods', () => {
    const skill = new BrowseSkill();
    expect(typeof skill.browse).toBe('function');
    expect(typeof skill.close).toBe('function');
  });
});
