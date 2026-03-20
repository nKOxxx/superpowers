/**
 * Telegram integration utilities for OpenClaw Superpowers
 * Formats skill outputs for optimal display in Telegram
 */

export interface TelegramMessage {
  text: string;
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  media?: string[];
}

export class TelegramFormatter {
  /**
   * Escape special characters for Telegram MarkdownV2
   */
  static escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Format browse results for Telegram
   */
  static formatBrowseResult(result: {
    url: string;
    title: string;
    loadTime: number;
    screenshotPath?: string;
    auditResults?: {
      score: number;
      violations: Array<{ impact: string; description: string }>;
    };
    errors: string[];
  }): TelegramMessage {
    const lines: string[] = [];
    
    lines.push(`🔍 *Browse Results*`);
    lines.push('');
    lines.push(`📍 URL: ${result.url}`);
    lines.push(`📄 Title: ${result.title || 'N/A'}`);
    lines.push(`⏱ Load Time: ${result.loadTime}ms`);
    
    if (result.auditResults) {
      lines.push('');
      lines.push(`♿ *Accessibility Score: ${result.auditResults.score}/100*\n`);
      
      if (result.auditResults.violations.length > 0) {
        const critical = result.auditResults.violations.filter(v => v.impact === 'critical').length;
        const serious = result.auditResults.violations.filter(v => v.impact === 'serious').length;
        lines.push(`⚠️ Violations: ${result.auditResults.violations.length} (${critical} critical, ${serious} serious)`);
      }
    }

    if (result.errors.length > 0) {
      lines.push('');
      lines.push(`❌ *Errors:*`);
      for (const error of result.errors) {
        lines.push(`  • ${error}`);
      }
    }

    return {
      text: lines.join('\n'),
      parse_mode: 'Markdown',
      media: result.screenshotPath ? [result.screenshotPath] : undefined
    };
  }

  /**
   * Format QA results for Telegram
   */
  static formatQaResult(result: {
    framework: string;
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coverage?: {
      lines: { percentage: number };
      functions: { percentage: number };
      branches: { percentage: number };
      overall: number;
    };
  }): TelegramMessage {
    const lines: string[] = [];
    
    lines.push(`🧪 *Test Results*`);
    lines.push('');
    lines.push(`Framework: ${result.framework}`);
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');
    lines.push(`📊 Summary:`);
    lines.push(`  • Total: ${result.totalTests}`);
    lines.push(`  • ✅ Passed: ${result.passedTests}`);
    lines.push(`  • ❌ Failed: ${result.failedTests}`);

    if (result.coverage) {
      lines.push('');
      lines.push(`📈 *Coverage:*`);
      lines.push(`  • Lines: ${result.coverage.lines.percentage.toFixed(1)}%`);
      lines.push(`  • Functions: ${result.coverage.functions.percentage.toFixed(1)}%`);
      lines.push(`  • Branches: ${result.coverage.branches.percentage.toFixed(1)}%`);
      lines.push(`  • Overall: *${result.coverage.overall.toFixed(1)}%*`);
    }

    return {
      text: lines.join('\n'),
      parse_mode: 'Markdown'
    };
  }

  /**
   * Format ship results for Telegram
   */
  static formatShipResult(result: {
    success: boolean;
    previousVersion: string;
    newVersion: string;
    changelog: string;
    errors: string[];
  }): TelegramMessage {
    const lines: string[] = [];
    
    lines.push(`🚀 *Release ${result.success ? 'Complete' : 'Failed'}*`);
    lines.push('');
    lines.push(`📦 Version: ${result.previousVersion} → *${result.newVersion}*`);
    
    if (result.changelog) {
      lines.push('');
      lines.push(`📝 *Changelog:*`);
      lines.push(result.changelog.substring(0, 1000)); // Truncate for Telegram
    }

    if (result.errors.length > 0) {
      lines.push('');
      lines.push(`❌ *Errors:*`);
      for (const error of result.errors.slice(0, 5)) {
        lines.push(`  • ${error}`);
      }
    }

    return {
      text: lines.join('\n'),
      parse_mode: 'Markdown'
    };
  }

  /**
   * Format CEO review results for Telegram
   */
  static formatCeoReviewResult(result: {
    featureName: string;
    batScore: { brand: number; attention: number; trust: number; total: number };
    tenStarScore: { overall: number };
    batRecommendation: string;
    buildVsBuy?: { recommendation: string };
  }): TelegramMessage {
    const lines: string[] = [];
    
    lines.push(`👔 *CEO Review: ${result.featureName}*`);
    lines.push('');
    
    // BAT Score with visual bars
    lines.push(`📊 *BAT Framework Score:*`);
    lines.push(`  Brand:     ${this.renderBar(result.batScore.brand, 5)} ${result.batScore.brand}/5`);
    lines.push(`  Attention: ${this.renderBar(result.batScore.attention, 5)} ${result.batScore.attention}/5`);
    lines.push(`  Trust:     ${this.renderBar(result.batScore.trust, 5)} ${result.batScore.trust}/5`);
    lines.push(`  *Total: ${result.batScore.total}/15*`);
    lines.push('');
    
    // Recommendation
    const recEmoji = result.batRecommendation === 'BUILD' ? '✅' : 
                     result.batRecommendation === 'CONSIDER' ? '⚠️' : '❌';
    lines.push(`💡 *Recommendation: ${recEmoji} ${result.batRecommendation}*`);
    lines.push('');
    
    // 10-Star Score
    lines.push(`⭐ *10-Star Rating: ${result.tenStarScore.overall}/10*`);
    
    if (result.buildVsBuy) {
      lines.push('');
      lines.push(`🏗 *Build vs Buy: ${result.buildVsBuy.recommendation.toUpperCase()}*`);
    }

    return {
      text: lines.join('\n'),
      parse_mode: 'Markdown'
    };
  }

  /**
   * Render a visual progress bar
   */
  private static renderBar(value: number, max: number): string {
    const filled = Math.round((value / max) * 8);
    const empty = 8 - filled;
    const filledChar = '█';
    const emptyChar = '░';
    return filledChar.repeat(filled) + emptyChar.repeat(empty);
  }

  /**
   * Chunk message if it exceeds Telegram's limit (4096 chars)
   */
  static chunkMessage(text: string, maxLength = 4000): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const line of text.split('\n')) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}

/**
 * Send results to Telegram via OpenClaw's message tool
 */
export async function sendTelegramMessage(
  result: TelegramMessage,
  options?: { chatId?: string; threadId?: string }
): Promise<void> {
  // This is a placeholder - in real usage, this would integrate
  // with OpenClaw's message tool or Telegram bot API
  console.log('[Telegram] Would send message:', result.text.substring(0, 100) + '...');
  
  if (result.media && result.media.length > 0) {
    console.log('[Telegram] Would send media:', result.media);
  }
}
