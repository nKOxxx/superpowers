# 2026-03-04 — Claude Skills Audit & Adaptation Task

## Target Repository
**Jeffallan/claude-skills**: 66 specialized skills for Claude Code
- URL: https://github.com/Jeffallan/claude-skills
- Stars: Trending (on awesome-claude-code list)
- Structure: skills/*/SKILL.md + references/

## Task Breakdown

### 1. Security Audit (Priority 1)
Audit all 66 skills for:
- [ ] Dangerous shell commands (rm -rf, sudo, chmod 777)
- [ ] Code injection vectors in dynamic code generation
- [ ] Unsafe file operations
- [ ] Hardcoded secrets or API keys
- [ ] Malicious patterns or backdoors
- [ ] Unsafe eval() or exec() usage

**Skill categories to audit:**
- Languages: python-pro, javascript-pro, typescript-pro, golang-pro, rust-engineer, etc.
- Frameworks: react-expert, nextjs-developer, nestjs-expert, django-expert, etc.
- DevOps: devops-engineer, kubernetes-specialist, terraform-engineer
- Security: secure-code-guardian, security-reviewer
- Data/ML: ml-pipeline, pandas-pro, rag-architect
- APIs: api-designer, graphql-architect, fastapi-expert

### 2. Contribution Opportunities (Priority 2)
Proposed PRs:
1. **Add OpenClaw/Moonshot skill** — Adaptation guide for non-Claude LLMs
2. **Add AgentVault security skill** — Secure credential management patterns
3. **Add "AI Agent Architecture" skill** — Multi-agent system design
4. **Fix security issues** (if any found in audit)
5. **Add Cognexia memory integration skill**

### 3. Moonshot/Kimi Adaptation (Priority 3)
Create parallel skill system:
- Convert `/plugin` commands to OpenClaw format
- Adjust context loading for Kimi's context window
- Adapt trigger mechanisms
- Create SKILL.md templates for Moonshot

## Repository Cloned
Location: ~/.openclaw/workspace/jeffallan-claude-skills/

## Security Audit Methodology
For each skill:
1. Read SKILL.md
2. Check references/ for code examples
3. Look for dangerous patterns:
   - Shell execution with user input
   - File system operations on paths
   - Dynamic code evaluation
   - Network requests without validation
4. Document findings
5. Suggest fixes

## Expected Output
- Security audit report (markdown)
- List of safe skills to use
- List of skills needing fixes
- Contribution PRs created
- Moonshot adaptation guide

## Next Steps (Tomorrow Morning)
1. Start security audit (estimate: 2-3 hours)
2. Document findings
3. Create fix PRs for any issues
4. Create new skill contributions
5. Write Moonshot adaptation guide
