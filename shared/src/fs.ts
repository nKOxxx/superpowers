/**
 * File system utilities for superpowers
 */
import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function findUpFile(startDir: string, fileName: string): string | null {
  let currentDir = startDir;
  
  while (currentDir !== path.dirname(currentDir)) {
    const filePath = path.join(currentDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

export function listFiles(dirPath: string, pattern?: RegExp): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const files = fs.readdirSync(dirPath);
  if (!pattern) {
    return files.map(f => path.join(dirPath, f));
  }
  
  return files
    .filter(f => pattern.test(f))
    .map(f => path.join(dirPath, f));
}