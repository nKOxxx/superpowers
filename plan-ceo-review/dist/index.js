export class PlanCeoReviewSkill {
    review(feature, options = {}) {
        const batScore = this.calculateBatScore(feature, options);
        const starRating = this.calculateStarRating(feature, options);
        const recommendation = this.getRecommendation(batScore.total, starRating.overall);
        const nextSteps = this.generateNextSteps(batScore, starRating);
        return {
            feature,
            batScore,
            starRating,
            recommendation,
            nextSteps,
            resources: this.estimateResources(starRating),
            timeline: this.estimateTimeline(starRating)
        };
    }
    compare(feature1, feature2, options = {}) {
        const review1 = this.review(feature1, options);
        const review2 = this.review(feature2, options);
        const winner = review1.batScore.total > review2.batScore.total
            ? feature1
            : review2.batScore.total > review1.batScore.total
                ? feature2
                : null;
        return {
            feature1: review1,
            feature2: review2,
            winner
        };
    }
    getFramework() {
        return {
            bat: {
                description: 'Evaluates product opportunities across Brand, Attention, and Trust dimensions',
                dimensions: [
                    { name: 'Brand', description: 'Does this strengthen our brand?', maxScore: 5 },
                    { name: 'Attention', description: 'Will users actually use this?', maxScore: 5 },
                    { name: 'Trust', description: 'Does this build user trust?', maxScore: 5 }
                ],
                scoring: [
                    { range: '12-15', recommendation: 'BUILD', description: 'Strong signal - prioritize' },
                    { range: '10-11', recommendation: 'BUILD', description: 'Good signal - proceed' },
                    { range: '8-9', recommendation: 'CONSIDER', description: 'Mixed signal - needs refinement' },
                    { range: '0-7', recommendation: "DON'T BUILD", description: 'Weak signal - reconsider' }
                ]
            },
            tenStar: {
                description: 'Inspired by Brian Chesky - push beyond "good enough" to exceptional',
                scale: [
                    { stars: 1, description: 'Works (barely)' },
                    { stars: 2, description: 'Functional but frustrating' },
                    { stars: 3, description: 'Meets basic needs' },
                    { stars: 4, description: 'Adequate' },
                    { stars: 5, description: 'Meets expectations' },
                    { stars: 6, description: 'Good' },
                    { stars: 7, description: 'Great - exceeds expectations' },
                    { stars: 8, description: 'Excellent - delightful' },
                    { stars: 9, description: 'World-class' },
                    { stars: 10, description: 'Transforms the category' }
                ]
            }
        };
    }
    calculateBatScore(feature, options) {
        // In a real implementation, this would use LLM or heuristics
        // For now, using placeholder scoring based on feature characteristics
        const featureLower = feature.toLowerCase();
        let brand = 3;
        let attention = 3;
        let trust = 3;
        // Heuristic scoring based on keywords
        if (featureLower.includes('ai') || featureLower.includes('smart')) {
            brand += 1;
            attention += 2;
        }
        if (featureLower.includes('security') || featureLower.includes('privacy')) {
            trust += 2;
        }
        if (featureLower.includes('mobile') || featureLower.includes('app')) {
            attention += 1;
        }
        if (options.audience === 'enterprise') {
            trust += 1;
        }
        if (options.market === 'saas') {
            brand += 1;
        }
        // Cap scores
        brand = Math.min(5, Math.max(0, brand));
        attention = Math.min(5, Math.max(0, attention));
        trust = Math.min(5, Math.max(0, trust));
        return {
            brand,
            attention,
            trust,
            total: brand + attention + trust
        };
    }
    calculateStarRating(feature, options) {
        const featureLower = feature.toLowerCase();
        // Base scores
        let problem = 5;
        let usability = 5;
        let delight = 5;
        let feasibility = 5;
        let viability = 5;
        // Adjust based on feature type
        if (featureLower.includes('ai') || featureLower.includes('automation')) {
            problem += 2;
            delight += 1;
            feasibility -= 1;
        }
        if (featureLower.includes('dark mode') || featureLower.includes('theme')) {
            usability += 1;
            delight += 1;
            feasibility += 2;
        }
        if (featureLower.includes('api') || featureLower.includes('integration')) {
            problem += 1;
            viability += 1;
        }
        if (options.audience === 'developers') {
            usability += 1;
        }
        // Calculate overall
        const overall = Math.round((problem + usability + delight + feasibility + viability) / 5);
        return {
            overall: Math.min(10, Math.max(1, overall)),
            problem: Math.min(10, Math.max(1, problem)),
            usability: Math.min(10, Math.max(1, usability)),
            delight: Math.min(10, Math.max(1, delight)),
            feasibility: Math.min(10, Math.max(1, feasibility)),
            viability: Math.min(10, Math.max(1, viability))
        };
    }
    getRecommendation(batTotal, stars) {
        if (batTotal >= 12 && stars >= 7) {
            return 'PRIORITY BUILD';
        }
        else if (batTotal >= 10 && stars >= 6) {
            return 'BUILD';
        }
        else if (batTotal >= 8 && stars >= 5) {
            return 'CONSIDER';
        }
        else {
            return "DON'T BUILD";
        }
    }
    generateNextSteps(batScore, starRating) {
        const steps = [];
        if (batScore.trust < 3) {
            steps.push('Add transparency, security features, or user control options');
        }
        if (starRating.usability < 6) {
            steps.push('Simplify the user experience - reduce friction');
        }
        if (starRating.feasibility < 5) {
            steps.push('Break down into smaller, achievable milestones');
        }
        if (steps.length === 0) {
            steps.push('Validate with target users through prototypes or interviews');
            steps.push('Define success metrics and monitoring strategy');
        }
        return steps;
    }
    estimateResources(starRating) {
        if (starRating.feasibility >= 8) {
            return 'Low - Straightforward implementation';
        }
        else if (starRating.feasibility >= 5) {
            return 'Medium - Standard development effort';
        }
        else {
            return 'High - Complex implementation requiring expertise';
        }
    }
    estimateTimeline(starRating) {
        if (starRating.feasibility >= 8) {
            return '2-4 weeks - Quick win';
        }
        else if (starRating.feasibility >= 5) {
            return '2-3 months - Standard development timeline';
        }
        else {
            return '3-6 months - Major initiative';
        }
    }
    formatReview(result, format = 'text') {
        switch (format) {
            case 'json':
                return JSON.stringify(result, null, 2);
            case 'markdown':
                return this.formatMarkdown(result);
            case 'text':
            default:
                return this.formatText(result);
        }
    }
    formatText(result) {
        const batBars = {
            brand: '●'.repeat(result.batScore.brand) + '○'.repeat(5 - result.batScore.brand),
            attention: '●'.repeat(result.batScore.attention) + '○'.repeat(5 - result.batScore.attention),
            trust: '●'.repeat(result.batScore.trust) + '○'.repeat(5 - result.batScore.trust)
        };
        const stars = '⭐'.repeat(result.starRating.overall) + '○'.repeat(10 - result.starRating.overall);
        const recommendationColor = result.recommendation === 'PRIORITY BUILD' || result.recommendation === 'BUILD'
            ? '\x1b[32m' // green
            : result.recommendation === 'CONSIDER'
                ? '\x1b[33m' // yellow
                : '\x1b[31m'; // red
        return `
📊 CEO Review: ${result.feature}

🎯 BAT Framework Score
   Brand:     ${batBars.brand} ${result.batScore.brand}/5
   Attention: ${batBars.attention} ${result.batScore.attention}/5
   Trust:     ${batBars.trust} ${result.batScore.trust}/5
   TOTAL:     ${result.batScore.total}/15

⭐ 10-Star Methodology
   Overall: ${stars} ${result.starRating.overall}/10

🎯 Final Verdict
   ${recommendationColor}${result.recommendation}\x1b[0m

📍 Next Steps:
${result.nextSteps.map(s => `   ${s}`).join('\n')}

💰 Resources: ${result.resources}
📅 Timeline: ${result.timeline}
`;
    }
    formatMarkdown(result) {
        return `# CEO Review: ${result.feature}

## BAT Framework Score

| Dimension | Score | Max |
|-----------|-------|-----|
| Brand | ${result.batScore.brand} | 5 |
| Attention | ${result.batScore.attention} | 5 |
| Trust | ${result.batScore.trust} | 5 |
| **Total** | **${result.batScore.total}** | **15** |

## 10-Star Methodology

Overall: ${result.starRating.overall}/10

| Dimension | Score | Max |
|-----------|-------|-----|
| Problem | ${result.starRating.problem} | 10 |
| Usability | ${result.starRating.usability} | 10 |
| Delight | ${result.starRating.delight} | 10 |
| Feasibility | ${result.starRating.feasibility} | 10 |
| Viability | ${result.starRating.viability} | 10 |

## Recommendation

**${result.recommendation}**

## Next Steps

${result.nextSteps.map(s => `- ${s}`).join('\n')}

## Resources

${result.resources}

## Timeline

${result.timeline}
`;
    }
}
//# sourceMappingURL=index.js.map