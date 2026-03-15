export type Score = 0 | 1 | 2 | 3 | 4 | 5;
export type Recommendation = 'build' | 'consider' | 'dont-build';

export interface BatScores {
  brand: Score;
  attention: Score;
  trust: Score;
}

export interface BatCriteria {
  brand: string[];
  attention: string[];
  trust: string[];
}

export interface CeoReviewOptions {
  feature: string;
  scores?: BatScores;
  autoScore?: boolean;
  context?: string;
}

export interface CeoReviewResult {
  feature: string;
  scores: BatScores;
  totalScore: number;
  maxScore: number;
  percentage: number;
  recommendation: Recommendation;
  reasoning: string;
  nextSteps: string[];
  thresholds: {
    build: number;
    consider: number;
    dontBuild: number;
  };
}

export const BAT_CRITERIA: BatCriteria = {
  brand: [
    'Aligns with core brand values',
    'Strengthens brand differentiation',
    'Appeals to target audience',
    'Consistent with brand voice',
    'Builds long-term brand equity'
  ],
  attention: [
    'Solves a real user pain point',
    'Has clear value proposition',
    'Different from competitors',
    'Easy to understand/demonstrate',
    'Creates viral/word-of-mouth potential'
  ],
  trust: [
    'Technically feasible to deliver',
    'Maintains quality standards',
    'Transparent about capabilities',
    'Respects user privacy/security',
    'Has clear success metrics'
  ]
};

export const THRESHOLDS = {
  build: 12,      // 12-15: STRONG SIGNAL → Build
  consider: 8,    // 8-11: MIXED → Consider carefully
  dontBuild: 0    // 0-7: WEAK → Don't build
};

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  build: 'STRONG SIGNAL → Build',
  consider: 'MIXED → Consider carefully',
  'dont-build': 'WEAK → Don\'t build'
};
