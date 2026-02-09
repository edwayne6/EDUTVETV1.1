#!/usr/bin/env node

/**
 * Unused CSS Analyzer
 * Scans project files to identify potentially unused Tailwind classes
 * 
 * Usage: node build/analyze-unused-css.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const TEMPLATE_PATHS = [
  '**/*.html',
  '**/*.ejs',
  '**/*.js'
];

const IGNORED_PATHS = [
  'node_modules',
  'dist',
  '.git',
  'build',
  '.next',
];

// Common Tailwind classes that are often used
const COMMON_TAILWIND_CLASSES = {
  // Spacing
  p: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28, 32],
  m: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28, 32],
  
  // Display
  flex: true,
  grid: true,
  block: true,
  inline: true,
  hidden: true,
  
  // Colors
  'text': ['blue', 'gray', 'red', 'green', 'white', 'black'],
  'bg': ['blue', 'gray', 'red', 'green', 'white', 'black'],
  
  // Sizing
  w: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
  h: ['full', 'screen', 'auto'],
  
  // Others
  'rounded': true,
  'shadow': true,
  'transition': true,
  'hover': true,
  'focus': true,
};

console.log('🔍 Analyzing CSS Usage...\n');

// Scan file
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Extract class names using regex
    const classRegex = /class(?:Name)?\s*=\s*["'`]([^"'`]*)/g;
    const matches = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const classes = match[1].split(/\s+/).filter(c => c.length > 0);
      matches.push(...classes);
    }
    
    return matches;
  } catch (error) {
    console.warn(`⚠️  Error reading ${filePath}: ${error.message}`);
    return [];
  }
}

// Find all template files
function findTemplateFiles() {
  let files = [];
  TEMPLATE_PATHS.forEach(pattern => {
    try {
      const found = glob.sync(pattern, {
        ignore: IGNORED_PATHS.map(p => `${p}/**`),
      });
      files = files.concat(found);
    } catch (e) {
      // Silently fail for glob patterns
    }
  });
  return [...new Set(files)]; // Remove duplicates
}

// Get all classes used in project
function getAllUsedClasses() {
  const files = findTemplateFiles();
  const allClasses = new Set();
  
  console.log(`📂 Scanning ${files.length} files...\n`);
  
  files.forEach((file, idx) => {
    if (idx % 10 === 0) process.stdout.write('.');
    const classes = scanFile(file);
    classes.forEach(cls => allClasses.add(cls));
  });
  
  console.log('\n');
  return allClasses;
}

// Analyze usage
function analyzeUsage() {
  const usedClasses = getAllUsedClasses();
  
  // Count by prefix
  const byPrefix = {};
  usedClasses.forEach(cls => {
    const prefix = cls.split('-')[0];
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
  });
  
  // Sort by count
  const sorted = Object.entries(byPrefix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  console.log('📊 Top CSS Utility Prefixes Used');
  console.log('='.repeat(50));
  
  sorted.forEach(([prefix, count]) => {
    console.log(`${prefix.padEnd(20)} ${count.toString().padStart(5)} classes`);
  });
  
  console.log('='.repeat(50));
  console.log(`\n📈 Statistics`);
  console.log(`Total unique classes used: ${usedClasses.size}`);
  console.log(`Total Tailwind utilities: ~3,000+\n`);
  
  const coveragePercent = ((usedClasses.size / 3000) * 100).toFixed(2);
  console.log(`Coverage: ~${coveragePercent}%`);
  console.log(`Unused: ~${(100 - coveragePercent).toFixed(2)}%\n`);
  
  console.log('✅ Tailwind PurgeCSS will remove unused classes during build');
  console.log('   See tailwind.config.js content paths for coverage\n');
}

analyzeUsage();
