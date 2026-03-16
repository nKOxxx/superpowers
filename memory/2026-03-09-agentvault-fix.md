# 2026-03-09 - AgentVault Database Bug Fix

## Problem
AgentVault desktop app was not persisting vault data between restarts. After closing and reopening, it would show "Create Your Vault" screen instead of unlock screen.

## Root Cause Analysis

### Initial Misdiagnosis
- Thought it was database directory not being created
- Thought it was environment variables not passing to child process
- Thought it was sqlite3 dependency missing

### Actual Root Cause
**Frontend-Backend Mismatch:**
- Frontend calls HTTP endpoints: `/api/init`, `/api/unlock`, `/api/status`, `/api/keys`
- Backend (main-simple.js) only had IPC handlers (`ipcMain.handle()`)
- HTTP requests to these endpoints returned 404, but frontend didn't handle errors properly
- Vault appeared to work in UI but data was never actually saved

## Fix Applied
Added HTTP API endpoints to `main-simple.js`:
- `GET /api/status` - Check vault status
- `POST /api/init` - Initialize vault with password  
- `POST /api/unlock` - Unlock vault with password
- `GET /api/keys` - List all keys

## Technical Lesson
**When building Electron apps with embedded HTTP server:**
1. Verify frontend and backend use same communication method (HTTP vs IPC)
2. Add error handling in frontend to catch API failures
3. Check browser devtools Network tab to see actual requests/responses
4. Don't assume "it works" just because UI responds - verify data persistence

## Commits
- `68e3614` - Add missing sqlite3 dependencies
- `f18adf8` - Add HTTP API endpoints to main-simple.js

## Verification Steps
1. Rebuild app with `npm run build`
2. Install new DMG
3. Create vault, add test key
4. Quit app completely (Cmd+Q)
5. Reopen - should show unlock screen, not create screen
6. Verify `~/Library/Application Support/AgentVault/vault.json` exists
