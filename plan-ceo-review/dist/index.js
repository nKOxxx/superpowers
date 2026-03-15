#!/usr/bin/env node
// Score descriptions
const SCORE_DESCRIPTIONS = {
    brand: {
        0: "Actively damages brand reputation",
        1: "Neutral or irrelevant to brand",
        2: "Slightly on-brand, not distinctive",
        3: "Reinforces existing brand positioning",
        4: "Meaningfully extends brand in new direction",
        5: "Defining brand moment, becomes synonymous with company"
    },
    attention: {
        0: "Completely ignored by users",
        1: "Brief glance, no engagement",
        2: "Mild interest, quickly forgotten",
        3: "Engages users, drives usage",
        4: "Creates buzz, organic sharing",
        5: "Cultural moment, viral phenomenon"
    },
    trust: {
        0: "Breaks user trust significantly",
        1: "Suspicious or questionable",
        2: "Neutral, no trust impact",
        3: "Builds some user trust",
        4: "Significant trust gain",
        5: "Trust breakthrough, establishes credibility"
    }
};
// Calculate recommendation based on total score
function calculateRecommendation(totalScore) {
    // 10-star methodology: total score 0-15 maps to 0-10 stars
    const starCount = Math.min(Math.max(Math.round(totalScore / 1.5), 0), 10);
    const stars = '⭐'.repeat(starCount) + '⚪'.repeat(10 - starCount);
    let recommendation;
    if (totalScore >= 10) {
        recommendation = 'BUILD';
    }
    else if (totalScore >= 8) {
        recommendation = 'CONSIDER';
    }
    else {
        recommendation = "DON'T BUILD";
    }
    return { recommendation, stars };
}
// Calculate confidence based on score distribution
function calculateConfidence(bat) {
    const scores = [bat.brand.score, bat.attention.score, bat.trust.score];
    const variance = Math.max(...scores) - Math.min(...scores);
    if (variance <= 1)
        return 'high';
    if (variance <= 2)
        return 'medium';
    return 'low';
}
// Generate risks based on scores
function generateRisks(bat, question) {
    const risks = [];
    if (bat.brand.score <= 2) {
        risks.push("Brand misalignment may confuse customers");
        risks.push("Could dilute existing brand equity");
    }
    if (bat.attention.score <= 2) {
        risks.push("Low user interest may lead to poor adoption");
        risks.push("Investment may not generate sufficient engagement");
    }
    if (bat.trust.score <= 2) {
        risks.push("Technical or execution risk is high");
        risks.push("Failure could damage reputation");
    }
    if (bat.brand.score >= 4 && bat.attention.score <= 2) {
        risks.push("Strong brand fit but users may not care");
    }
    if (bat.attention.score >= 4 && bat.trust.score <= 2) {
        risks.push("High interest but execution risk is concerning");
    }
    if (bat.brand.score <= 2 && bat.attention.score >= 4) {
        risks.push("Users want it but it doesn't align with brand");
    }
    // Add generic risks if list is short
    if (risks.length < 2) {
        risks.push("Competitive response may reduce impact");
        risks.push("Market timing could affect success");
    }
    return risks.slice(0, 4);
}
// Generate next steps based on recommendation
function generateNextSteps(recommendation, bat) {
    const steps = [];
    switch (recommendation) {
        case 'BUILD':
            steps.push("✅ Validate with 10 target customers");
            steps.push("📋 Define MVP scope and timeline");
            steps.push("📊 Identify key metrics for success");
            steps.push("👥 Assign dedicated team/resources");
            steps.push("🚀 Set launch date and begin development");
            break;
        case 'CONSIDER':
            if (bat.brand.score < 3) {
                steps.push("🎨 Refine concept to better align with brand");
            }
            if (bat.attention.score < 3) {
                steps.push("🔍 Conduct user research to validate demand");
            }
            if (bat.trust.score < 3) {
                steps.push("🛠 Build proof-of-concept to reduce technical risk");
            }
            steps.push("📝 Re-evaluate with modified proposal");
            steps.push("⏱ Set decision deadline (2-4 weeks)");
            break;
        case "DON'T BUILD":
            steps.push("📝 Document learnings from this analysis");
            steps.push("👀 Monitor market for changes that might improve scores");
            steps.push("🎯 Focus resources on higher-scoring opportunities");
            steps.push("💡 Consider alternative approaches to the problem");
            break;
    }
    return steps;
}
// Auto-score based on question analysis (simple heuristic)
function autoScore(question) {
    const q = question.toLowerCase();
    // Brand scoring heuristics
    let brandScore = 3;
    if (q.includes('ai') || q.includes('ml') || q.includes('machine learning'))
        brandScore = 4;
    if (q.includes('mobile app') || q.includes('ios') || q.includes('android'))
        brandScore = 3;
    if (q.includes('new market') || q.includes('expansion'))
        brandScore = 3;
    if (q.includes('premium') || q.includes('enterprise'))
        brandScore = 4;
    if (q.includes('core') || q.includes('flagship'))
        brandScore = 5;
    if (q.includes('unrelated') || q.includes('side project'))
        brandScore = 2;
    // Attention scoring heuristics
    let attentionScore = 3;
    if (q.includes('ai') || q.includes('automation'))
        attentionScore = 4;
    if (q.includes('free') || q.includes('save money') || q.includes('discount'))
        attentionScore = 4;
    if (q.includes('integration') || q.includes('connect'))
        attentionScore = 3;
    if (q.includes('export') || q.includes('report'))
        attentionScore = 2;
    if (q.includes('viral') || q.includes('social'))
        attentionScore = 4;
    if (q.includes('enterprise') || q.includes('b2b'))
        attentionScore = 3;
    // Trust scoring heuristics
    let trustScore = 3;
    if (q.includes('security') || q.includes('privacy') || q.includes('encryption'))
        trustScore = 4;
    if (q.includes('beta') || q.includes('experimental'))
        trustScore = 2;
    if (q.includes('partner') || q.includes('integration'))
        trustScore = 3;
    if (q.includes('proven') || q.includes('industry standard'))
        trustScore = 4;
    if (q.includes('new technology') || q.includes('cutting edge'))
        trustScore = 2;
    if (q.includes('core competency'))
        trustScore = 5;
    return {
        brand: {
            score: brandScore,
            rationale: SCORE_DESCRIPTIONS.brand[brandScore]
        },
        attention: {
            score: attentionScore,
            rationale: SCORE_DESCRIPTIONS.attention[attentionScore]
        },
        trust: {
            score: trustScore,
            rationale: SCORE_DESCRIPTIONS.trust[trustScore]
        }
    };
}
// Main review function
export function review(options) {
    let bat;
    if (options.autoScore && (options.brand === undefined || options.attention === undefined || options.trust === undefined)) {
        // Auto-score
        bat = autoScore(options.question);
    }
    else {
        // Use provided scores or defaults
        bat = {
            brand: {
                score: (options.brand ?? 3),
                rationale: SCORE_DESCRIPTIONS.brand[options.brand ?? 3]
            },
            attention: {
                score: (options.attention ?? 3),
                rationale: SCORE_DESCRIPTIONS.attention[options.attention ?? 3]
            },
            trust: {
                score: (options.trust ?? 3),
                rationale: SCORE_DESCRIPTIONS.trust[options.trust ?? 3]
            }
        };
    }
    const totalScore = bat.brand.score + bat.attention.score + bat.trust.score;
    const { recommendation, stars } = calculateRecommendation(totalScore);
    const confidence = calculateConfidence(bat);
    const risks = generateRisks(bat, options.question);
    const nextSteps = generateNextSteps(recommendation, bat);
    return {
        question: options.question,
        bat,
        totalScore,
        stars,
        recommendation,
        confidence,
        risks,
        nextSteps
    };
}
// Format result as message
function formatResult(result) {
    let message = `📊 CEO Review: ${result.question}\n\n`;
    message += `**BAT Analysis**\n\n`;
    message += `🔷 Brand: ${result.bat.brand.score}/5\n  ${result.bat.brand.rationale}\n\n`;
    message += `👁 Attention: ${result.bat.attention.score}/5\n  ${result.bat.attention.rationale}\n\n`;
    message += `🤝 Trust: ${result.bat.trust.score}/5\n  ${result.bat.trust.rationale}\n\n`;
    message += `**Total Score:** ${result.totalScore}/15\n`;
    message += `${result.stars}\n\n`;
    const recEmoji = result.recommendation === 'BUILD' ? '🟢' :
        result.recommendation === 'CONSIDER' ? '🟡' : '🔴';
    message += `**Recommendation:** ${recEmoji} ${result.recommendation}\n`;
    message += `**Confidence:** ${result.confidence}\n\n`;
    if (result.risks.length > 0) {
        message += `**Key Risks:**\n`;
        for (const risk of result.risks) {
            message += `• ${risk}\n`;
        }
        message += '\n';
    }
    message += `**Next Steps:**\n`;
    for (const step of result.nextSteps) {
        message += `${step}\n`;
    }
    return message;
}
// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {
        question: '',
        autoScore: true,
        json: false
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            switch (key) {
                case 'brand':
                case 'b':
                    options.brand = parseInt(value || args[++i], 10);
                    options.autoScore = false;
                    break;
                case 'attention':
                case 'a':
                    options.attention = parseInt(value || args[++i], 10);
                    options.autoScore = false;
                    break;
                case 'trust':
                case 't':
                    options.trust = parseInt(value || args[++i], 10);
                    options.autoScore = false;
                    break;
                case 'auto-score':
                    options.autoScore = value !== 'false';
                    break;
                case 'json':
                case 'j':
                    options.json = true;
                    break;
            }
        }
        else if (!arg.startsWith('-') && !options.question) {
            options.question = arg.replace(/^["']|["']$/g, '');
        }
    }
    if (!options.question) {
        console.error(`
Usage: plan-ceo-review <question> [options]

Arguments:
  question                  The product question to evaluate (e.g., "Should we build a mobile app?")

Options:
  -b, --brand <0-5>         Brand score (manual mode)
  -a, --attention <0-5>     Attention score (manual mode)
  -t, --trust <0-5>         Trust score (manual mode)
  --auto-score              Use auto-scoring (default: true)
  -j, --json                Output as JSON

Examples:
  plan-ceo-review "Should we build a mobile app?"
  plan-ceo-review "AI Feature" --brand=4 --attention=5 --trust=3
  plan-ceo-review "New Feature" --json

BAT Framework:
  Brand (0-5): Does this align with and enhance our brand?
  Attention (0-5): Will users care about and engage with this?
  Trust (0-5): Can we reliably deliver and maintain this?

Scoring:
  10-15 stars (BUILD): Strong alignment across all dimensions
  8-9 stars (CONSIDER): Promising but needs refinement
  0-7 stars (DON'T BUILD): High risk or poor fit
`);
        process.exit(1);
    }
    const result = review(options);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(formatResult(result));
    }
    process.exit(result.recommendation === "DON'T BUILD" ? 1 : 0);
}
//# sourceMappingURL=index.js.map