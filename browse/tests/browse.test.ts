import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowseSkill } from '../src/index.js';

describe('BrowseSkill', () => {
  let skill: BrowseSkill;

  beforeAll(async () => {
    skill = new BrowseSkill();
    await skill.init();
  });

  afterAll(async () => {
    await skill.close();
  });

  it('should be defined', () => {
    expect(skill).toBeDefined();
    expect(typeof skill.screenshot).toBe('function');
    expect(typeof skill.testUrl).toBe('function');
    expect(typeof skill.click).toBe('function');
    expect(typeof skill.type).toBe('function');
    expect(typeof skill.runFlow).toBe('function');
  });

  it('should initialize browser', () => {
    expect(skill).toBeInstanceOf(BrowseSkill);
  });
});
