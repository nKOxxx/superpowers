// Utility helpers for CLI commands

export function createSpinner(text: string) {
  return {
    text,
    start() {
      console.log(`⏳ ${this.text}`);
    },
    stop() {
      // Spinner stops silently
    }
  };
}

export function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

export function logError(message: string): void {
  console.error(`❌ ${message}`);
}

export function logInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}

export function logWarning(message: string): void {
  console.warn(`⚠️  ${message}`);
}
