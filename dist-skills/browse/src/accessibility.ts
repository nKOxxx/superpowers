import { Page } from 'playwright';
import * as axeCore from 'axe-core';
import { AuditResult, AccessibilityViolation } from './types';

export class AccessibilityAuditor {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async run(): Promise<AuditResult> {
    // Inject axe-core
    await this.injectAxe();

    // Run audit
    const results = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).axe.run((err: any, results: any) => {
          if (err) {
            resolve({ error: err.message });
          } else {
            resolve(results);
          }
        });
      });
    });

    if ((results as any).error) {
      throw new Error((results as any).error);
    }

    const axeResults = results as any;

    return {
      violations: this.mapViolations(axeResults.violations || []),
      passes: axeResults.passes?.length || 0,
      incomplete: axeResults.incomplete?.length || 0,
      inapplicable: axeResults.inapplicable?.length || 0
    };
  }

  private async injectAxe(): Promise<void> {
    const axeSource = axeCore.source;
    await this.page.addInitScript(() => {
      eval(axeSource);
    });
    
    // Also inject immediately for current page
    await this.page.evaluate((source) => {
      eval(source);
    }, axeSource);
  }

  private mapViolations(violations: any[]): AccessibilityViolation[] {
    return violations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      target: v.nodes?.map((n: any) => n.target?.join(', ')) || []
    }));
  }
}
