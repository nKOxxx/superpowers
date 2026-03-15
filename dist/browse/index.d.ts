/**
 * Browse Skill - Browser automation with Playwright
 *
 * Usage: /browse <url> [--viewport=mobile|tablet|desktop] [--full-page] [--actions=<json>]
 */
import { BrowserOptions, SkillResult } from '../types.js';
export declare class BrowseSkill {
    private browser?;
    private page?;
    private startTime;
    execute(options: BrowserOptions): Promise<SkillResult>;
    private resolveViewport;
    private executeAction;
    private takeScreenshot;
    private close;
}
export declare function run(args: string[]): Promise<SkillResult>;
//# sourceMappingURL=index.d.ts.map