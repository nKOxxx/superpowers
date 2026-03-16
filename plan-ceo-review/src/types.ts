export interface BatScore {
  brand: number;
  attention: number;
  trust: number;
  total: number;
}

export interface StarRating {
  overall: number;
  problem: number;
  usability: number;
  delight: number;
  feasibility: number;
  viability: number;
}

export interface ReviewOptions {
  audience?: string;
  market?: string;
}

export interface ReviewResult {
  feature: string;
  batScore: BatScore;
  starRating: StarRating;
  recommendation: string;
  nextSteps: string[];
  resources: string;
  timeline: string;
}

export interface CompareResult {
  feature1: ReviewResult;
  feature2: ReviewResult;
  winner: string | null;
}

export interface FrameworkInfo {
  bat: {
    description: string;
    dimensions: Array<{
      name: string;
      description: string;
      maxScore: number;
    }>;
    scoring: Array<{
      range: string;
      recommendation: string;
      description: string;
    }>;
  };
  tenStar: {
    description: string;
    scale: Array<{
      stars: number;
      description: string;
    }>;
  };
}
