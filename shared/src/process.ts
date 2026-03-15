/**
 * Process execution utilities for superpowers
 */
import { spawn, exec as execCallback, SpawnOptions } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCallback);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function exec(command: string, options?: { cwd?: string; env?: NodeJS.ProcessEnv }): Promise<ExecResult> {
  try {
    const result = await execAsync(command, {
      cwd: options?.cwd,
      env: { ...process.env, ...options?.env },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.code || 1,
    };
  }
}

export function spawnAsync(
  command: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    
    const child = spawn(command, args, {
      stdio: options?.silent ? 'pipe' : 'inherit',
      ...options,
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const str = data.toString();
        stdout.push(str);
        if (!options?.silent) {
          process.stdout.write(str);
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const str = data.toString();
        stderr.push(str);
        if (!options?.silent) {
          process.stderr.write(str);
        }
      });
    }

    child.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode || 0,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
      });
    });
  });
}

export async function runGit(args: string[], cwd?: string): Promise<ExecResult> {
  return exec(`git ${args.join(' ')}`, { cwd });
}