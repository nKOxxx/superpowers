/**
 * BAT Framework scores
 */
export interface BATScore {
  brand: number;
  attention: number;
  trust: number;
}

/**
 * CEO Review options
 */
export interface CEORReviewOptions {
  feature: string;
  goal?: string;
  audience?: string;
  competition?: string;
  trust?: string;
  brandScore?: number;
  attentionScore?: number;
  trustScore?: number;
}

/**
 * CEO Review result
 */
export interface CEORReviewResult {
  feature: string;
  scores: BATScore;
  total: number;
  recommendation: 'BUILD' | 'CONSIDER' | 'DONT_BUILD';
  rationale: string[];
  nextSteps: string[];
}
