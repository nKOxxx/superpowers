import chalk from 'chalk';

export const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  bold: chalk.bold
};

export function success(message: string): void {
  console.log(colors.success('✓'), message);
}

export function error(message: string): void {
  console.log(colors.error('✗'), message);
}

export function warning(message: string): void {
  console.log(colors.warning('⚠'), message);
}

export function info(message: string): void {
  console.log(colors.info('ℹ'), message);
}

export function step(message: string): void {
  console.log(colors.primary('→'), message);
}

export function header(text: string): void {
  console.log('\n' + colors.bold(colors.primary(text)));
  console.log(colors.primary('─'.repeat(text.length)));
}

export function section(title: string): void {
  console.log('\n' + colors.bold(title));
}

export function list(items: string[], indent: number = 2): void {
  const prefix = ' '.repeat(indent) + '• ';
  items.forEach(item => console.log(prefix + item));
}

export function table(data: Array<Record<string, string | number>>): void {
  if (data.length === 0) return;
  
  const keys = Object.keys(data[0]);
  const widths: Record<string, number> = {};
  
  // Calculate column widths
  keys.forEach(key => {
    widths[key] = Math.max(
      key.length,
      ...data.map(row => String(row[key]).length)
    );
  });
  
  // Print header
  const header = keys.map(key => key.toUpperCase().padEnd(widths[key])).join('  ');
  console.log(colors.bold(header));
  console.log(keys.map(key => '─'.repeat(widths[key])).join('  '));
  
  // Print rows
  data.forEach(row => {
    const line = keys.map(key => String(row[key]).padEnd(widths[key])).join('  ');
    console.log(line);
  });
}

export function divider(): void {
  console.log(colors.muted('─'.repeat(60)));
}

export function spinner(text: string) {
  // Simple spinner implementation
  // In production, use ora package
  console.log(colors.primary('◐'), text);
  
  return {
    succeed: (msg?: string) => success(msg || text),
    fail: (msg?: string) => error(msg || text),
    stop: () => {}
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function indent(text: string, spaces: number = 2): string {
  const prefix = ' '.repeat(spaces);
  return text.split('\n').map(line => prefix + line).join('\n');
}

export function box(text: string): void {
  const lines = text.split('\n');
  const width = Math.max(...lines.map(l => l.length));
  
  console.log('┌' + '─'.repeat(width + 2) + '┐');
  lines.forEach(line => {
    console.log('│ ' + line.padEnd(width) + ' │');
  });
  console.log('└' + '─'.repeat(width + 2) + '┘');
}

export function progressBar(current: number, total: number, width: number = 30): string {
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percent * 100)}%`;
}
