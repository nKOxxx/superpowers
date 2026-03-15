// BAT Framework for Product Decisions
// Brand, Attention, Trust scoring with 10-star methodology
// Questionnaire questions
const QUESTIONNAIRE = {
    brand: [
        {
            question: "Does this align with our core brand values?",
            weight: 1.0,
            highScoreIndicators: ["Embodies values", "Natural extension", "Brand-defining"]
        },
        {
            question: "Will customers immediately associate this with us?",
            weight: 0.8,
            highScoreIndicators: ["Instantly recognizable", "Differentiated", "Signature feature"]
        },
        {
            question: "Could this become a defining characteristic of our brand?",
            weight: 1.2,
            highScoreIndicators: ["Category-defining", "Market leader", "Unforgettable"]
        }
    ],
    attention: [
        {
            question: "Will users actively seek out this feature/product?",
            weight: 1.0,
            highScoreIndicators: ["High demand", "Must-have", "Game-changer"]
        },
        {
            question: "Is there significant word-of-mouth potential?",
            weight: 0.9,
            highScoreIndicators: ["Viral potential", "Talk-worthy", "Shareable"]
        },
        {
            question: "Does this solve a painful or frequently encountered problem?",
            weight: 1.1,
            highScoreIndicators: ["Critical pain point", "Daily problem", "Expensive problem"]
        }
    ],
    trust: [
        {
            question: "Can we reliably deliver on the promises made?",
            weight: 1.0,
            highScoreIndicators: ["Proven capability", "Within expertise", "Low technical risk"]
        },
        {
            question: "Will this work as users expect, every time?",
            weight: 1.1,
            highScoreIndicators: ["Highly reliable", "Battle-tested", "Predictable"]
        },
        {
            question: "Does this leverage or build upon existing trust?",
            weight: 0.9,
            highScoreIndicators: ["Builds on reputation", "Earned trust", "Proven track record"]
        }
    ]
};
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
// Parse command line arguments
function parseArgs(args) {
    const result = {
        question: '',
        interactive: process.env.BAT_DEFAULT_INTERACTIVE !== 'false'
    };
    // Join all non-option args as the question
    const nonOptionArgs = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--interactive') {
            result.interactive = true;
        }
        else if (arg === '--no-interactive') {
            result.interactive = false;
        }
        else if (!arg.startsWith('--')) {
            nonOptionArgs.push(arg);
        }
    }
    result.question = nonOptionArgs.join(' ').replace(/^["']|["']$/g, '');
    return result;
}
// Calculate recommendation based on total score
function calculateRecommendation(totalScore) {
    const starCount = Math.min(Math.max(Math.floor(totalScore / 1.5), 3), 10);
    const stars = '⭐'.repeat(starCount);
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
            steps.push("Validate with 10 target customers");
            steps.push("Define MVP scope and timeline");
            steps.push("Identify key metrics for success");
            steps.push("Assign dedicated team/resources");
            break;
        case 'CONSIDER':
            if (bat.brand.score < 3) {
                steps.push("Refine concept to better align with brand");
            }
            if (bat.attention.score < 3) {
                steps.push("Conduct user research to validate demand");
            }
            if (bat.trust.score < 3) {
                steps.push("Build proof-of-concept to reduce technical risk");
            }
            steps.push("Re-evaluate with modified proposal");
            break;
        case "DON'T BUILD":
            steps.push("Document learnings from this analysis");
            steps.push("Monitor market for changes that might improve scores");
            steps.push("Focus resources on higher-scoring opportunities");
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
    // Attention scoring heuristics
    let attentionScore = 3;
    if (q.includes('ai') || q.includes('automation'))
        attentionScore = 4;
    if (q.includes('free') || q.includes('save money'))
        attentionScore = 4;
    if (q.includes('integration') || q.includes('connect'))
        attentionScore = 3;
    if (q.includes('export') || q.includes('report'))
        attentionScore = 2;
    // Trust scoring heuristics
    let trustScore = 3;
    if (q.includes('security') || q.includes('privacy'))
        trustScore = 4;
    if (q.includes('beta') || q.includes('experimental'))
        trustScore = 2;
    if (q.includes('partner') || q.includes('integration'))
        trustScore = 3;
    if (q.includes('proven') || q.includes('industry standard'))
        trustScore = 4;
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
// Format result as message
function formatResult(result) {
    let message = `📊 CEO Review: ${result.question}\n\n`;
    message += `**BAT Analysis**\n\n`;
    message += `🔷 Brand: ${result.bat.brand.score}/5 - ${result.bat.brand.rationale}\n`;
    message += `👁 Attention: ${result.bat.attention.score}/5 - ${result.bat.attention.rationale}\n`;
    message += `🤝 Trust: ${result.bat.trust.score}/5 - ${result.bat.trust.rationale}\n\n`;
    message += `**Total Score:** ${result.totalScore}/15\n`;
    message += `${result.stars}\n\n`;
    message += `**Recommendation:** ${result.recommendation}\n`;
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
        message += `• ${step}\n`;
    }
    return message;
}
// Main handler function
export async function handler(context) {
    try {
        const { question, interactive } = parseArgs(context.args);
        if (!question) {
            return {
                success: false,
                message: 'Product question is required. Usage: /plan-ceo-review "Should we build X?"',
                error: 'Missing question'
            };
        }
        // For interactive mode (Telegram), return questionnaire state
        if (interactive && context.channel === 'telegram') {
            return {
                success: true,
                message: `📊 CEO Review: "${question}"\n\nLet's evaluate this through the BAT framework.\n\n**Brand Dimension**\nDoes this align with your core brand values?`,
                interactive: true,
                buttons: [
                    { text: '0 - Damages', callback_data: 'bat:brand:0' },
                    { text: '1', callback_data: 'bat:brand:1' },
                    { text: '2', callback_data: 'bat:brand:2' },
                    { text: '3', callback_data: 'bat:brand:3' },
                    { text: '4', callback_data: 'bat:brand:4' },
                    { text: '5 - Defining', callback_data: 'bat:brand:5' }
                ]
            };
        }
        // Auto-score for non-interactive mode
        const bat = autoScore(question);
        const totalScore = bat.brand.score + bat.attention.score + bat.trust.score;
        const { recommendation, stars } = calculateRecommendation(totalScore);
        const confidence = calculateConfidence(bat);
        const risks = generateRisks(bat, question);
        const nextSteps = generateNextSteps(recommendation, bat);
        const result = {
            question,
            bat,
            totalScore,
            stars,
            recommendation,
            confidence,
            risks,
            nextSteps
        };
        return {
            success: true,
            message: formatResult(result),
            data: result
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `CEO review failed: ${errorMessage}`,
            error: errorMessage
        };
    }
}
// Handle interactive callbacks
export function handleCallback(callbackData, currentState) {
    const parts = callbackData.split(':');
    if (parts[0] !== 'bat') {
        return {
            success: false,
            message: 'Invalid callback',
            error: 'Invalid callback data'
        };
    }
    const dimension = parts[1];
    const score = parseInt(parts[2], 10);
    // Update state
    if (!currentState.scores)
        currentState.scores = {};
    currentState.scores[dimension] = score;
    // Determine next dimension
    const dimensions = ['brand', 'attention', 'trust'];
    const currentIndex = dimensions.indexOf(dimension);
    if (currentIndex < dimensions.length - 1) {
        const nextDimension = dimensions[currentIndex + 1];
        const dimensionEmoji = { brand: '🔷', attention: '👁', trust: '🤝' };
        const dimensionQuestions = {
            brand: 'Does this align with your core brand values?',
            attention: 'Will users actively seek this out?',
            trust: 'Can you reliably deliver on promises?'
        };
        return {
            success: true,
            message: `${dimensionEmoji[nextDimension]} **${nextDimension.charAt(0).toUpperCase() + nextDimension.slice(1)} Dimension**\n${dimensionQuestions[nextDimension]}`,
            interactive: true,
            buttons: [
                { text: '0', callback_data: `bat:${nextDimension}:0` },
                { text: '1', callback_data: `bat:${nextDimension}:1` },
                { text: '2', callback_data: `bat:${nextDimension}:2` },
                { text: '3', callback_data: `bat:${nextDimension}:3` },
                { text: '4', callback_data: `bat:${nextDimension}:4` },
                { text: '5', callback_data: `bat:${nextDimension}:5` }
            ]
        };
    }
    // All dimensions scored, calculate final result
    const bat = {
        brand: { score: currentState.scores.brand || 3, rationale: SCORE_DESCRIPTIONS.brand[currentState.scores.brand || 3] },
        attention: { score: currentState.scores.attention || 3, rationale: SCORE_DESCRIPTIONS.attention[currentState.scores.attention || 3] },
        trust: { score: currentState.scores.trust || 3, rationale: SCORE_DESCRIPTIONS.trust[currentState.scores.trust || 3] }
    };
    const totalScore = bat.brand.score + bat.attention.score + bat.trust.score;
    const { recommendation, stars } = calculateRecommendation(totalScore);
    const confidence = calculateConfidence(bat);
    const risks = generateRisks(bat, currentState.question || '');
    const nextSteps = generateNextSteps(recommendation, bat);
    const result = {
        question: currentState.question || '',
        bat,
        totalScore,
        stars,
        recommendation,
        confidence,
        risks,
        nextSteps
    };
    return {
        success: true,
        message: formatResult(result),
        data: result
    };
}
// CLI entry point
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (import.meta.url === `file://${__filename}`) {
    const args = process.argv.slice(2);
    const context = {
        args,
        options: {},
        channel: 'cli'
    };
    handler(context).then(result => {
        console.log(result.message);
        if (result.data) {
            console.log('\n--- JSON ---\n');
            console.log(JSON.stringify(result.data, null, 2));
        }
        process.exit(result.success ? 0 : 1);
    });
}
//# sourceMappingURL=index.js.map