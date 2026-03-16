# 2026-03-09 - AgentVault Persistence Bug - FIXED

## Problem
AgentVault desktop app showed "Create Your Vault" screen on every restart, even when vault.json existed with saved credentials.

## Root Cause
`vaultPath` was calculated at **module load time** (before `app.whenReady()`), which returned a different path than after Electron was fully initialized.

```javascript
// BEFORE (broken):
const userDataPath = app.getPath('userData');  // Called before app ready
const vaultPath = path.join(userDataPath, 'vault.json');  // Wrong path

// AFTER (fixed):
let vaultPath = path.join(userDataPath, 'vault.json');  // Can be updated
app.whenReady().then(() => {
  vaultPath = app.getPath('userData') + '/vault.json';  // Correct path
});
```

## The Fix
1. Changed `vaultPath` from `const` to `let`
2. Re-check vault path after `app.whenReady()`
3. Update global `vaultPath` to use correct path
4. Set `vaultData.initialized = true` if vault file found

## Commits
- `6f8e8d9` - Remove sqlite3 dependency (not used)
- `6b756ae` - Add debug logging
- `d7e49fc` - Change vaultPath to let for dynamic update
- `7c10e40` - Check vault path after app is ready
- `eed2d17` - Check for existing vault file on startup
- `f18adf8` - Add HTTP API endpoints
- `68e3614` - Add missing dependencies

## Verification
✅ Create vault → Add key → Quit (Cmd+Q) → Reopen → Shows "Unlock Vault" → Enter password → Keys loaded

## Technical Lesson
**In Electron apps:**
- `app.getPath()` may return different values before vs after `app.whenReady()`
- Always calculate paths AFTER app is fully initialized
- Use `let` not `const` for paths that need dynamic updates
