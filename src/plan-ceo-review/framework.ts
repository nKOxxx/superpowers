import { BatScore, StarRating, CeoReviewResult } from '../shared/types.js';

export function calculateBatScore(
  brand: number,
  attention: number,
  trust: number
): BatScore {
  const total = brand + attention + trust;
  
  let recommendation: BatScore['recommendation'];
  if (total >= 12) recommendation = 'BUILD';
  else if (total >= 8) recommendation = 'CONSIDER';
  else recommendation = "DON'T BUILD";
  
  return {
    brand: Math.max(0, Math.min(5, brand)),
    attention: Math.max(0, Math.min(5, attention)),
    trust: Math.max(0, Math.min(5, trust)),
    total,
    recommendation
  };
}

export function calculateStarRating(
  problem: number,
  usability: number,
  delight: number,
  feasibility: number,
  viability: number
): StarRating {
  const overall = Math.round((problem + usability + delight + feasibility + viability) / 5);
  
  return {
    problem: Math.max(1, Math.min(10, problem)),
    usability: Math.max(1, Math.min(10, usability)),
    delight: Math.max(1, Math.min(10, delight)),
    feasibility: Math.max(1, Math.min(10, feasibility)),
    viability: Math.max(1, Math.min(10, viability)),
    overall
  };
}

export function generateBatExplanation(score: BatScore): string {
  const explanations: string[] = [];
  
  if (score.brand >= 4) explanations.push('Strong brand alignment');
  else if (score.brand <= 2) explanations.push('Consider brand impact');
  
  if (score.attention >= 4) explanations.push('High user interest');
  else if (score.attention <= 2) explanations.push('May struggle to capture attention');
  
  if (score.trust >= 4) explanations.push('Builds user trust');
  else if (score.trust <= 2) explanations.push('Trust concerns need addressing');
  
  return explanations.join('. ') || 'Neutral across BAT dimensions';
}

export function analyzeFeature(
  feature: string,
  audience?: string,
  market?: string
): CeoReviewResult {
  // Simulated analysis - in real implementation, this could use AI/ML
  // For now, using heuristic-based scoring
  
  const featureLower = feature.toLowerCase();
  
  // Brand scoring based on feature type
  let brand = 3;
  if (featureLower.includes('ai') || featureLower.includes('mobile')) brand = 4;
  if (featureLower.includes('security') || featureLower.includes('privacy')) brand = 5;
  
  // Attention scoring
  let attention = 3;
  if (featureLower.includes('dashboard') || featureLower.includes('analytics')) attention = 4;
  if (featureLower.includes('automation') || featureLower.includes('assistant')) attention = 5;
  
  // Trust scoring
  let trust = 3;
  if (featureLower.includes('security') || featureLower.includes('auth')) trust = 5;
  if (featureLower.includes('ai') && !featureLower.includes('transparent')) trust = 2;
  
  const bat = calculateBatScore(brand, attention, trust);
  
  // Star ratings
  const problem = attention >= 4 ? 8 : 6;
  const usability = 7;
  const delight = brand >= 4 ? 8 : 6;
  const feasibility = 7;
  const viability = trust >= 4 ? 8 : 6;
  
  const stars = calculateStarRating(problem, usability, delight, feasibility, viability);
  
  // Generate next steps
  const nextSteps: string[] = [];
  if (trust < 4) {
    nextSteps.push('Add transparency, security features, or user control options');
  }
  if (attention < 4) {
    nextSteps.push('Simplify the user experience - reduce friction');
  }
  if (brand < 4) {
    nextSteps.push('Align messaging with core brand values');
  }
  nextSteps.push('Validate with target users through prototypes or interviews');
  
  // Resource and timeline estimates
  const resources = bat.total >= 12 ? 'Medium-High' : bat.total >= 8 ? 'Medium' : 'Low';
  const timeline = feasibility >= 8 ? '1-2 months' : feasibility >= 5 ? '2-3 months' : '3-6 months';
  
  return {
    feature,
    audience,
    market,
    bat,
    stars,
    nextSteps,
    resources,
    timeline
  };
}

export function formatBatScore(score: BatScore): string {
  const bar = (n: number) => '●'.repeat(n) + '○'.repeat(5 - n);
  return `
🎯 BAT Framework Score
   Brand:     ${bar(score.brand)} ${score.brand}/5
   Attention: ${bar(score.attention)} ${score.attention}/5
   Trust:     ${bar(score.trust)} ${score.trust}/5
   TOTAL:     ${score.total}/15 ${score.total >= 12 ? '🟢' : score.total >= 8 ? '🟡' : '🔴'}

📋 Recommendation: ${score.recommendation}
   ${generateBatExplanation(score)}
`;
}

export function formatStarRating(stars: StarRating): string {
  const bar = (n: number) => '⭐'.repeat(Math.floor(n / 2)) + (n % 2 === 1 ? '½' : '') + '○'.repeat(5 - Math.ceil(n / 2));
  
  return `
⭐ 10-Star Methodology
   Overall: ${bar(stars.overall)} ${stars.overall}/10
   
   Problem:     ${stars.problem}/10 - ${getStarDescription(stars.problem)}
   Usability:   ${stars.usability}/10 - ${getStarDescription(stars.usability)}
   Delight:     ${stars.delight}/10 - ${getStarDescription(stars.delight)}
   Feasibility: ${stars.feasibility}/10 - ${getStarDescription(stars.feasibility)}
   Viability:   ${stars.viability}/10 - ${getStarDescription(stars.viability)}
`;
}

function getStarDescription(stars: number): string {
  if (stars >= 9) return 'World-class';
  if (stars >= 8) return 'Excellent';
  if (stars >= 7) return 'Great';
  if (stars >= 6) return 'Good';
  if (stars >= 5) return 'Meets expectations';
  if (stars >= 4) return 'Adequate';
  if (stars >= 3) return 'Basic';
  return 'Needs work';
}

export function formatReview(result: CeoReviewResult): string {
  const verdict = result.bat.total >= 12 
    ? 'PRIORITY BUILD' 
    : result.bat.total >= 8 
      ? 'BUILD' 
      : "DON'T BUILD";
  
  let output = `\n📊 CEO Review: ${result.feature}\n`;
  
  if (result.audience) {
    output += `   Target: ${result.audience}\n`;
  }
  if (result.market) {
    output += `   Market: ${result.market}\n`;
  }
  output += '\n';
  
  output += formatBatScore(result.bat);
  output += '\n';
  output += formatStarRating(result.stars);
  output += '\n';
  
  output += `🎯 Final Verdict\n`;
  output += `   ${verdict} - ${getVerdictDescription(result)}\n\n`;
  
  output += `📍 Next Steps:\n`;
  for (let i = 0; i < result.nextSteps.length; i++) {
    output += `   ${i + 1}. ${result.nextSteps[i]}\n`;
  }
  output += '\n';
  
  output += `💰 Resources: ${result.resources}\n`;
  output += `📅 Timeline: ${result.timeline}\n`;
  
  return output;
}

function getVerdictDescription(result: CeoReviewResult): string {
  if (result.bat.total >= 12) {
    return 'Strong BAT score and high star rating indicate product-market fit potential.';
  }
  if (result.bat.total >= 8) {
    return 'Good signals but some areas need refinement before committing.';
  }
  return 'Weak signals suggest reconsidering or significantly redesigning the feature.';
}

export function formatReviewMarkdown(result: CeoReviewResult): string {
  const verdict = result.bat.total >= 12 ? '✅ BUILD' : result.bat.total >= 8 ? '⚠️ CONSIDER' : '❌ DON\'T BUILD';
  
  return `# CEO Review: ${result.feature}

${result.audience ? `**Target Audience:** ${result.audience}  ` : ''}
${result.market ? `**Market:** ${result.market}  ` : ''}

## BAT Framework Score

| Dimension | Score |
|-----------|-------|
| Brand | ${result.bat.brand}/5 |
| Attention | ${result.bat.attention}/5 |
| Trust | ${result.bat.trust}/5 |
| **Total** | **${result.bat.total}/15** |

**Recommendation:** ${result.bat.recommendation}

## 10-Star Methodology

| Dimension | Score |
|-----------|-------|
| Problem | ${result.stars.problem}/10 |
| Usability | ${result.stars.usability}/10 |
| Delight | ${result.stars.delight}/10 |
| Feasibility | ${result.stars.feasibility}/10 |
| Viability | ${result.stars.viability}/10 |
| **Overall** | **${result.stars.overall}/10** |

## Verdict

**${verdict}**

## Next Steps

${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Resources & Timeline

- **Resources:** ${result.resources}
- **Timeline:** ${result.timeline}

---
*Generated with plan-ceo-review*
`;
}

export function formatReviewJson(result: CeoReviewResult): string {
  return JSON.stringify({
    feature: result.feature,
    audience: result.audience,
    market: result.market,
    bat: {
      brand: result.bat.brand,
      attention: result.bat.attention,
      trust: result.bat.trust,
      total: result.bat.total,
      recommendation: result.bat.recommendation
    },
    stars: {
      problem: result.stars.problem,
      usability: result.stars.usability,
      delight: result.stars.delight,
      feasibility: result.stars.feasibility,
      viability: result.stars.viability,
      overall: result.stars.overall
    },
    verdict: result.bat.total >= 12 ? 'BUILD' : result.bat.total >= 8 ? 'CONSIDER' : "DON'T BUILD",
    nextSteps: result.nextSteps,
    resources: result.resources,
    timeline: result.timeline
  }, null, 2);
}

export function printFramework(): string {
  return `
# BAT Framework

The BAT framework evaluates product opportunities across three dimensions:

## Brand (0-5)
Does this strengthen our brand?

- 5: Iconic feature that defines the brand
- 4: Strongly aligns with brand positioning
- 3: Neutral brand impact
- 2: Slight brand misalignment
- 1: Weakens or dilutes brand
- 0: Actively harms brand

## Attention (0-5)
Will users actually use this?

- 5: Must-have, high demand
- 4: Strong user interest
- 3: Moderate appeal
- 2: Niche interest
- 1: Hard to communicate value
- 0: No user interest

## Trust (0-5)
Does this build user trust?

- 5: Significantly increases trust
- 4: Builds confidence
- 3: Neutral impact
- 2: Minor trust concerns
- 1: Significant trust issues
- 0: Violates user trust

## Scoring Summary

| Score | Recommendation | Action |
|-------|----------------|--------|
| 12-15 | BUILD | Strong signal - prioritize |
| 10-11 | BUILD | Good signal - proceed |
| 8-9 | CONSIDER | Mixed signal - refine |
| 0-7 | DON'T BUILD | Weak signal - reconsider |

# 10-Star Methodology

Inspired by Brian Chesky's approach to product excellence:

## Rating Scale

| Stars | Description |
|-------|-------------|
| 1★ | Works (barely) |
| 2★ | Functional but frustrating |
| 3★ | Meets basic needs |
| 4★ | Adequate |
| 5★ | Meets expectations |
| 6★ | Good |
| 7★ | Great - exceeds expectations |
| 8★ | Excellent - delightful |
| 9★ | World-class |
| 10★ | Transforms the category |

## Dimensions

- **Problem** - Solves real user problem?
- **Usability** - Easy to use?
- **Delight** - Creates moments of joy?
- **Feasibility** - Can we build this?
- **Viability** - Sustainable business?

## The 10-Star Vision

For any feature, ask: "What would a 10-star version look like?"

A 10-star experience works perfectly, anticipates needs, provides value in 30 seconds,
creates genuine delight, users recommend, becomes indispensable, sets industry standards.
`;
}
