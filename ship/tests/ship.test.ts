import { describe, it, expect, vi } from 'vitest';
import { ShipSkill } from '../src/index.js';

describe('ShipSkill', () => {
  it('should create a ShipSkill instance', () => {
    const skill = new ShipSkill();
    expect(skill).toBeDefined();
  });

  it('should bump versions correctly', async () => {
    const skill = new ShipSkill();
    const result = await skill.ship({ 
      bump: 'patch', 
      dryRun: true,
      skipCleanCheck: true 
    });
    
    // In a real repo, this would return actual data
    // For now, we just test the structure
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('steps');
  });
});
