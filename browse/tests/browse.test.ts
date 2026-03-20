/**
 * Browse skill tests
 */

import { describe, it, expect } from 'vitest';
import { BrowseSkill, type BrowseOptions } from '../src/index.js';

describe('BrowseSkill', () => {
  it('should initialize correctly', () => {
    const skill = new BrowseSkill();
    expect(skill).toBeDefined();
  });

  it('should parse viewport correctly', () => {
    const options: BrowseOptions = {
      url: 'https://example.com',
      viewport: { width: 1920, height: 1080 }
    };
    expect(options.viewport).toEqual({ width: 1920, height: 1080 });
  });
});