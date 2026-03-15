"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanCEOReviewSkill = void 0;
class PlanCEOReviewSkill {
    calculateAutoScores(feature, description) {
        const text = `${feature} ${description || ''}`.toLowerCase();
        // Keywords that indicate brand value
        const brandKeywords = ['brand', 'identity', 'recognition', 'reputation', 'unique', 'differentiator'];
        const brandScore = Math.min(5, brandKeywords.filter(k => text.includes(k)).length + 2);
        // Keywords that indicate attention potential
        const attentionKeywords = ['viral', 'share', 'growth', 'engagement', 'acquisition', 'marketing', 'social'];
        const attentionScore = Math.min(5, attentionKeywords.filter(k => text.includes(k)).length + 2);
        // Keywords that indicate trust building
        const trustKeywords = ['security', 'privacy', 'reliable', 'transparent', 'authentic', 'trust', 'safe'];
        const trustScore = Math.min(5, trustKeywords.filter(k => text.includes(k)).length + 2);
        return {
            brand: Math.max(1, brandScore),
            attention: Math.max(1, attentionScore),
            trust: Math.max(1, trustScore),
        };
    }
    getRecommendation(totalScore) {
        if (totalScore >= 10) {
            return {
                recommendation: 'build',
                reasoning: 'Strong BAT score (10+ stars). This feature scores well across Brand, Attention, and Trust dimensions. It aligns with our strategic goals and has clear value proposition.',
            };
        }
        else if (totalScore >= 8) {
            return {
                recommendation: 'consider',
                reasoning: 'Moderate BAT score (8-9 stars). This feature has potential but may need refinement. Consider prototype validation or A/B testing before full investment.',
            };
        }
        else {
            return {
                recommendation: 'dont-build',
                reasoning: 'Low BAT score (<8 stars). This feature does not meet our threshold for strategic investment. Consider shelving or significant redesign.',
            };
        }
    }
    generateNextSteps(recommendation, scores) {
        const steps = [];
        switch (recommendation) {
            case 'build':
                steps.push('✅ Proceed with detailed product specification');
                steps.push('📋 Create implementation roadmap with milestones');
                steps.push('👥 Assign team and allocate resources');
                steps.push('📊 Define success metrics and KPIs');
                steps.push('🚀 Target MVP launch within 4-6 weeks');
                break;
            case 'consider':
                steps.push('🤔 Conduct user research to validate assumptions');
                steps.push('🧪 Build prototype or proof-of-concept');
                steps.push('📈 Analyze competitive landscape');
                steps.push('💰 Estimate development cost vs. projected impact');
                steps.push('🔄 Re-evaluate with BAT framework after validation');
                break;
            case 'dont-build':
                steps.push('🛑 Archive feature request with rationale');
                steps.push('📝 Document why it was rejected (BAT scores)');
                steps.push('🔍 Monitor market for changes that might improve scores');
                if (scores.brand < 3)
                    steps.push('💡 Consider how to strengthen brand alignment');
                if (scores.attention < 3)
                    steps.push('💡 Explore ways to increase attention/virality');
                if (scores.trust < 3)
                    steps.push('💡 Identify trust-building opportunities');
                break;
        }
        return steps;
    }
    async review(options) {
        let scores;
        if (options.autoScore) {
            scores = this.calculateAutoScores(options.feature, options.description);
        }
        else if (options.scores) {
            scores = {
                brand: Math.min(5, Math.max(0, options.scores.brand)),
                attention: Math.min(5, Math.max(0, options.scores.attention)),
                trust: Math.min(5, Math.max(0, options.scores.trust)),
            };
        }
        else {
            scores = { brand: 0, attention: 0, trust: 0 };
        }
        const totalScore = scores.brand + scores.attention + scores.trust;
        const { recommendation, reasoning } = this.getRecommendation(totalScore);
        const nextSteps = this.generateNextSteps(recommendation, scores);
        return {
            feature: options.feature,
            description: options.description,
            scores,
            totalScore,
            recommendation,
            reasoning,
            nextSteps,
        };
    }
    formatReview(result) {
        const lines = [];
        lines.push(`# CEO Review: ${result.feature}`);
        lines.push('');
        if (result.description) {
            lines.push(`> ${result.description}`);
            lines.push('');
        }
        lines.push('## BAT Framework Scores');
        lines.push('');
        lines.push(`| Dimension | Score |`);
        lines.push(`|-----------|-------|`);
        lines.push(`| Brand     | ${'⭐'.repeat(result.scores.brand)}${'○'.repeat(5 - result.scores.brand)} |`);
        lines.push(`| Attention | ${'⭐'.repeat(result.scores.attention)}${'○'.repeat(5 - result.scores.attention)} |`);
        lines.push(`| Trust     | ${'⭐'.repeat(result.scores.trust)}${'○'.repeat(5 - result.scores.trust)} |`);
        lines.push(`| **Total** | **${result.totalScore}/15** |`);
        lines.push('');
        const recEmoji = result.recommendation === 'build' ? '✅' : result.recommendation === 'consider' ? '🤔' : '🛑';
        lines.push(`## Recommendation: ${recEmoji} ${result.recommendation.toUpperCase().replace('-', ' ')}`);
        lines.push('');
        lines.push(result.reasoning);
        lines.push('');
        lines.push('## Next Steps');
        lines.push('');
        for (const step of result.nextSteps) {
            lines.push(`- ${step}`);
        }
        return lines.join('\n');
    }
}
exports.PlanCEOReviewSkill = PlanCEOReviewSkill;
// CLI entry point
if (require.main === module) {
    async function main() {
        const args = process.argv.slice(2);
        if (args.length === 0) {
            console.error('Usage: plan-ceo-review "Feature Name" [options]');
            console.error('');
            console.error('Options:');
            console.error('  --brand=<1-5>        Brand score (0-5)');
            console.error('  --attention=<1-5>    Attention score (0-5)');
            console.error('  --trust=<1-5>        Trust score (0-5)');
            console.error('  --auto               Auto-calculate scores from keywords');
            console.error('  --description=<text> Feature description');
            process.exit(1);
        }
        const feature = args[0];
        const options = { feature };
        // Parse arguments
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--brand=')) {
                options.scores = options.scores || { brand: 0, attention: 0, trust: 0 };
                options.scores.brand = parseInt(arg.split('=')[1], 10);
            }
            else if (arg.startsWith('--attention=')) {
                options.scores = options.scores || { brand: 0, attention: 0, trust: 0 };
                options.scores.attention = parseInt(arg.split('=')[1], 10);
            }
            else if (arg.startsWith('--trust=')) {
                options.scores = options.scores || { brand: 0, attention: 0, trust: 0 };
                options.scores.trust = parseInt(arg.split('=')[1], 10);
            }
            else if (arg.startsWith('--description=')) {
                options.description = arg.split('=').slice(1).join('=');
            }
            else if (arg === '--auto') {
                options.autoScore = true;
            }
        }
        const skill = new PlanCEOReviewSkill();
        try {
            const result = await skill.review(options);
            console.log(skill.formatReview(result));
            console.log('');
            console.log('---');
            console.log('JSON Output:');
            console.log(JSON.stringify(result, null, 2));
        }
        catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    main();
}
//# sourceMappingURL=index.js.map