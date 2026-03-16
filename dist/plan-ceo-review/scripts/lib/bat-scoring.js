/**
 * BAT (Brand, Attention, Trust) scoring framework
 */
export async function evaluateBAT(options) {
    // This is a simplified heuristic-based evaluation
    // In production, this could use AI/LLM for more nuanced scoring
    const scores = calculateScores(options);
    const rationale = generateRationale(options, scores);
    return {
        ...scores,
        total: scores.brand + scores.attention + scores.trust,
        rationale
    };
}
function calculateScores(options) {
    const description = (options.description || options.feature || '').toLowerCase();
    const goal = (options.goal || '').toLowerCase();
    // Brand scoring (0-5)
    let brand = 3; // Default neutral
    if (description.includes('brand') || description.includes('identity'))
        brand = 5;
    else if (description.includes('ui') || description.includes('design'))
        brand = 4;
    else if (description.includes('api') || description.includes('internal'))
        brand = 2;
    else if (description.includes('fix') || description.includes('bug'))
        brand = 2;
    // Attention scoring (0-5)
    let attention = 3; // Default neutral
    if (goal.includes('engagement') || goal.includes('daily'))
        attention = 5;
    else if (goal.includes('retention') || goal.includes('usage'))
        attention = 4;
    else if (description.includes('notification') || description.includes('alert'))
        attention = 4;
    else if (description.includes('admin') || description.includes('settings'))
        attention = 2;
    else if (description.includes('analytics') || description.includes('report'))
        attention = 3;
    // Trust scoring (0-5)
    let trust = 3; // Default neutral
    if (description.includes('security') || description.includes('auth'))
        trust = 5;
    else if (description.includes('privacy') || description.includes('gdpr'))
        trust = 5;
    else if (description.includes('payment') || description.includes('billing'))
        trust = 4;
    else if (description.includes('backup') || description.includes('export'))
        trust = 4;
    else if (description.includes('experimental') || description.includes('beta'))
        trust = 2;
    return {
        brand: Math.min(5, Math.max(0, brand)),
        attention: Math.min(5, Math.max(0, attention)),
        trust: Math.min(5, Math.max(0, trust))
    };
}
function generateRationale(options, scores) {
    const description = options.description || options.feature || '';
    const brandReasons = {
        0: 'No brand impact',
        1: 'Weakens brand perception',
        2: 'Minor brand impact, mostly invisible',
        3: 'Neutral brand impact, meets expectations',
        4: 'Strengthens brand, differentiated feature',
        5: 'Iconic feature that defines category'
    };
    const attentionReasons = {
        0: 'No user engagement',
        1: 'Rarely used, minimal value',
        2: 'Occasional use, niche audience',
        3: 'Regular use by some users',
        4: 'High engagement, weekly+ use',
        5: 'Core workflow, daily use expected'
    };
    const trustReasons = {
        0: 'Erodes user trust',
        1: 'Significant trust concerns',
        2: 'Minor trust implications',
        3: 'Meets standard trust expectations',
        4: 'Builds user confidence',
        5: 'Critical safety/security feature'
    };
    return {
        brand: brandReasons[scores.brand] || 'Unknown',
        attention: attentionReasons[scores.attention] || 'Unknown',
        trust: trustReasons[scores.trust] || 'Unknown'
    };
}
//# sourceMappingURL=bat-scoring.js.map