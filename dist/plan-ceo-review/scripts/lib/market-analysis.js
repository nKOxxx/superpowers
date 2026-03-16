/**
 * Market analysis for plan-ceo-review skill
 */
// Simple keyword-based market analysis
// In production, this could integrate with market research APIs
export async function analyzeMarket(options) {
    const description = (options.description || options.feature || '').toLowerCase();
    const market = (options.market || '').toLowerCase();
    return {
        competitors: identifyCompetitors(description, market),
        trend: analyzeTrend(description, market),
        riskLevel: assessRisk(description, market),
        timing: assessTiming(description)
    };
}
function identifyCompetitors(description, market) {
    const competitors = [];
    // SaaS/ productivity
    if (description.includes('notification') || description.includes('alert')) {
        competitors.push('Slack', 'Teams', 'Discord');
    }
    if (description.includes('ai') || description.includes('chat')) {
        competitors.push('ChatGPT', 'Claude', 'Gemini');
    }
    if (description.includes('collaboration') || description.includes('doc')) {
        competitors.push('Notion', 'Google Docs', 'Confluence');
    }
    if (description.includes('project') || description.includes('task')) {
        competitors.push('Asana', 'Monday', 'ClickUp');
    }
    // Communication
    if (description.includes('email') || description.includes('message')) {
        competitors.push('Gmail', 'Outlook', 'Superhuman');
    }
    // Generic fallback
    if (competitors.length === 0) {
        competitors.push('Market incumbents', 'Open source alternatives');
    }
    return competitors;
}
function analyzeTrend(description, market) {
    const risingKeywords = ['ai', 'ml', 'automation', 'crypto', 'web3', 'mobile-first'];
    const decliningKeywords = ['flash', 'silverlight', 'flash', 'deprecated'];
    for (const kw of risingKeywords) {
        if (description.includes(kw))
            return 'rising';
    }
    for (const kw of decliningKeywords) {
        if (description.includes(kw))
            return 'declining';
    }
    return 'stable';
}
function assessRisk(description, market) {
    const highRiskKeywords = ['security', 'payment', 'compliance', 'privacy', 'medical'];
    const lowRiskKeywords = ['analytics', 'report', 'dashboard', 'ui', 'cosmetic'];
    for (const kw of highRiskKeywords) {
        if (description.includes(kw))
            return 'high';
    }
    for (const kw of lowRiskKeywords) {
        if (description.includes(kw))
            return 'low';
    }
    return 'medium';
}
function assessTiming(description) {
    const urgentKeywords = ['security', 'bug', 'fix', 'critical', 'vulnerability'];
    for (const kw of urgentKeywords) {
        if (description.includes(kw))
            return 'Urgent - security/critical issue';
    }
    return 'Standard - can be scheduled in roadmap';
}
//# sourceMappingURL=market-analysis.js.map