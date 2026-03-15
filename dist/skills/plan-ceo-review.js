"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.planCEOReview = planCEOReview;
const bat_js_1 = require("../lib/bat.js");
const format = __importStar(require("../lib/format.js"));
async function planCEOReview(options) {
    format.header(`CEO Review: ${options.feature}`);
    if (options.goal) {
        format.info(`Goal: ${options.goal}`);
    }
    if (options.market) {
        format.info(`Market: ${options.market}`);
    }
    console.log();
    // If scores not provided, estimate based on feature description
    const brandScore = options.brandScore ?? estimateBrandScore(options.feature, options.market);
    const attentionScore = options.attentionScore ?? estimateAttentionScore(options.feature, options.goal);
    const trustScore = options.trustScore ?? estimateTrustScore(options.feature);
    const evaluation = (0, bat_js_1.calculateBATScore)(options.feature, brandScore, attentionScore, trustScore);
    // Output formatted results
    const output = (0, bat_js_1.formatBATOutput)(evaluation, options.feature);
    console.log(output);
    // Additional context
    console.log();
    format.divider();
    if (evaluation.recommendation === 'BUILD') {
        format.success('This feature scores well on BAT framework - proceed with confidence');
    }
    else if (evaluation.recommendation === 'CONSIDER') {
        format.warning('This feature has potential but needs more validation');
    }
    else {
        format.error('This feature does not meet the threshold for investment');
    }
    return {
        feature: options.feature,
        evaluation,
        recommendation: evaluation.recommendation
    };
}
function estimateBrandScore(feature, market) {
    const feature_lower = feature.toLowerCase();
    // High brand impact features
    if (feature_lower.includes('ai') || feature_lower.includes('ml'))
        return 4;
    if (feature_lower.includes('premium') || feature_lower.includes('pro'))
        return 4;
    if (feature_lower.includes('security') || feature_lower.includes('privacy'))
        return 4;
    // Medium brand impact
    if (feature_lower.includes('dashboard') || feature_lower.includes('analytics'))
        return 3;
    if (feature_lower.includes('integration') || feature_lower.includes('api'))
        return 3;
    if (feature_lower.includes('mobile') || feature_lower.includes('app'))
        return 3;
    // Lower brand impact
    if (feature_lower.includes('dark mode') || feature_lower.includes('theme'))
        return 2;
    if (feature_lower.includes('notification') || feature_lower.includes('email'))
        return 2;
    // Default
    return 3;
}
function estimateAttentionScore(feature, goal) {
    const feature_lower = feature.toLowerCase();
    const goal_lower = goal?.toLowerCase() || '';
    // Daily use features
    if (goal_lower.includes('daily') || goal_lower.includes('core'))
        return 5;
    if (feature_lower.includes('chat') || feature_lower.includes('messaging'))
        return 4;
    if (feature_lower.includes('search') || feature_lower.includes('find'))
        return 4;
    if (feature_lower.includes('collaboration') || feature_lower.includes('share'))
        return 4;
    // Weekly use
    if (feature_lower.includes('report') || feature_lower.includes('analytics'))
        return 3;
    if (feature_lower.includes('export') || feature_lower.includes('import'))
        return 3;
    // Monthly/Rare use
    if (feature_lower.includes('settings') || feature_lower.includes('preferences'))
        return 2;
    if (feature_lower.includes('onboarding') || feature_lower.includes('setup'))
        return 2;
    // Default
    return 3;
}
function estimateTrustScore(feature) {
    const feature_lower = feature.toLowerCase();
    // Critical trust features
    if (feature_lower.includes('security') || feature_lower.includes('2fa'))
        return 5;
    if (feature_lower.includes('backup') || feature_lower.includes('recovery'))
        return 5;
    if (feature_lower.includes('encryption') || feature_lower.includes('privacy'))
        return 5;
    if (feature_lower.includes('audit') || feature_lower.includes('log'))
        return 4;
    // Reliability features
    if (feature_lower.includes('uptime') || feature_lower.includes('monitoring'))
        return 4;
    if (feature_lower.includes('performance') || feature_lower.includes('speed'))
        return 4;
    // Standard features
    if (feature_lower.includes('sso') || feature_lower.includes('auth'))
        return 4;
    if (feature_lower.includes('support') || feature_lower.includes('help'))
        return 3;
    // Neutral
    if (feature_lower.includes('ui') || feature_lower.includes('design'))
        return 2;
    // Default
    return 3;
}
//# sourceMappingURL=plan-ceo-review.js.map