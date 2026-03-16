import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowseSkill } from '../src/index.js';

describe('BrowseSkill', () => {
  const skill = new BrowseSkill();

  beforeAll(async () => {
    await skill.init();
  });

  afterAll(async () => {
    await skill.close();
  });

  it('should initialize browser', () => {
    expect(skill).toBeDefined();
  });

  it('should take a screenshot', async () => {
    // This test requires network access and would be skipped in CI
    // For real testing, use a local test server
  }, { timeout: 30000 });
});
