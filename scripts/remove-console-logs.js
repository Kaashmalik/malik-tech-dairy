#!/usr/bin/env node

/**
 * Script to remove all console.log statements from the codebase
 * Run with: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directories to search
const directories = ['src', 'scripts'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Counters
let filesProcessed = 0;
let consoleLogsRemoved = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  let removedInFile = 0;

  const newLines = lines.map(line => {
    // Match console.log, console.error, console.warn, console.info
    const consoleRegex = /^\s*console\.(log|error|warn|info)\([^)]*\);?\s*$/;
    
    if (consoleRegex.test(line)) {
      // Check if it's a console.log we should remove
      if (!line.includes('Sentry') && !line.includes('error reporting')) {
        modified = true;
        removedInFile++;
        consoleLogsRemoved++;
        return null; // Remove the line
      }
    }
    
    return line;
  }).filter(Boolean); // Remove null lines

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
  }

  filesProcessed++;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDirectory(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(filePath);
    }
  }
}

// Main execution

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDirectory(dir);
  }
});


if (consoleLogsRemoved > 0) {
  console.log('💡 Consider using a proper logging service like Sentry for production.');
} else {
}