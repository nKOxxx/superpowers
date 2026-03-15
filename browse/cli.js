#!/usr/bin/env node
import('./dist/index.js').then(m => {
  // Module runs automatically when imported directly
}).catch(err => {
  console.error('Failed to load browse skill:', err.message);
  process.exit(1);
});
