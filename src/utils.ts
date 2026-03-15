/**
 * Shared utilities for Superpowers skills
 */

import { execSync, spawn } from 'child_process';
import { SkillResult } from './types.js';

export function execCommand(command: string, cwd?: string): string {
  return execSync(command, { 
    cwd, 
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
}

export function execCommandSilent(command: string, cwd?: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return { stdout, stderr: '', code: 0 };
  } catch (error: any) {
    return { 
      stdout: error.stdout?.toString() || '', 
      stderr: error.stderr?.toString() || '', 
      code: error.status || 1 
    };
  }
}

export async function streamCommand(
  command: string, 
  args: string[], 
  cwd?: string,
  onOutput?: (data: string) => void
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      onOutput?.(chunk);
    });

    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      onOutput?.(chunk);
    });

    child.on('close', (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
  });
}

export function success(message: string, data?: unknown): SkillResult {
  return { success: true, message, data };
}

export function failure(message: string, errors?: string[]): SkillResult {
  return { success: false, message, errors };
}

export function detectPackageManager(cwd: string): 'npm' | 'yarn' | 'pnpm' {
  try {
    execCommand('ls -la', cwd);
    if (require('fs').existsSync(`${cwd}/pnpm-lock.yaml`)) return 'pnpm';
    if (require('fs').existsSync(`${cwd}/yarn.lock`)) return 'yarn';
    return 'npm';
  } catch {
    return 'npm';
  }
}

export function getRunCommand(pm: 'npm' | 'yarn' | 'pnpm'): string {
  switch (pm) {
    case 'yarn': return 'yarn';
    case 'pnpm': return 'pnpm';
    default: return 'npm run';
  }
}

export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function stripAnsi(str: string): string {
  return str.replace(/\u001b\[\d+m/g, '');
}
