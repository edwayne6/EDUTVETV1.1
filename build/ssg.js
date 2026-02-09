#!/usr/bin/env node

/**
 * Static Site Generation (SSG) Build Script
 * Pre-renders static pages to HTML at build time for maximum performance
 * 
 * Usage: node build/ssg.js
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const OUTPUT_DIR = path.join(__dirname, '../dist');
const VIEWS_DIR = path.join(__dirname, '../views');
const PUBLIC_DIR = path.join(__dirname, '..');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Build configuration for static pages
 */
const staticPages = [
  {
    name: 'Home Page',
    template: 'index',
    output: 'index.html',
    data: {
      title: 'Edu-TVET - Empowering Learning',
      description: 'EduTVET provides access to quality TVET documents for teaching, learning, and professional growth.',
      scripts: ['/scripts/scripts.js', '/scripts/scroll-animations.js']
    }
  },
  {
    name: 'Documents',
    template: 'documents',
    output: 'documents.html',
    data: {
      title: 'EduTVET - Documents',
      description: 'Browse and download TVET documents categorized by type and level.',
      departments: [
        'Agriculture & Environmental',
        'Applied Sciences',
        'Automotive & Mechanical',
        'Building & Civil Eng',
        'Business & Entrepreneurship',
        'Business Studies',
        'Computing & ICT',
        'Cosmetology',
        'Electrical & Electronics',
        'Fashion & Apparel Design',
        'Health & Applied Sciences',
        'Liberal Studies',
        'Tourism & Hospitality'
      ],
      documents: [], // Will be populated from API or cache
      scripts: ['/scripts/document-cache.js']
    }
  }
];

/**
 * Render a page using EJS template
 */
async function renderPage(templateName, data) {
  try {
    const templatePath = path.join(VIEWS_DIR, `${templateName}.ejs`);
    const layoutPath = path.join(VIEWS_DIR, 'layout.ejs');

    // Render the page content
    const pageContent = fs.readFileSync(templatePath, 'utf8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Render page first
    const renderedContent = await ejs.render(pageContent, data, {
      filename: templatePath,
      views: [VIEWS_DIR]
    });

    // Render layout with page content
    const finalHtml = await ejs.render(layoutContent, {
      ...data,
      body: renderedContent
    }, {
      filename: layoutPath,
      views: [VIEWS_DIR]
    });

    return finalHtml;
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Write rendered page to file
 */
function writePage(filename, content) {
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`✅ Generated: ${filename} (${(content.length / 1024).toFixed(2)} KB)`);
}

/**
 * Build all static pages
 */
async function build() {
  console.log('🏗️  Starting Static Site Generation...\n');
  console.log(`📂 Output directory: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const page of staticPages) {
    try {
      console.log(`📝 Building: ${page.name}...`);
      const html = await renderPage(page.template, page.data);
      writePage(page.output, html);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to build ${page.name}: ${error.message}\n`);
      errorCount++;
    }
  }

  // Copy static assets (optional, if needed)
  copyStaticAssets();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Build Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully generated: ${successCount} pages`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} pages`);
  }
  console.log(`📦 Total size: ${getTotalSize(OUTPUT_DIR)}`);
  console.log(`\nGenerated pages are in: ${OUTPUT_DIR}`);
}

/**
 * Copy static assets to dist folder (optional)
 */
function copyStaticAssets() {
  const assetsToKeep = ['styles.css', 'scripts', 'images'];
  console.log('\n📦 Note: Copy static assets (CSS, JS, images) to dist/ manually or configure a bundler.');
}

/**
 * Get total size of generated files
 */
function getTotalSize(dir) {
  let totalSize = 0;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  });

  return (totalSize / 1024).toFixed(2) + ' KB';
}

// Run build
build().catch(error => {
  console.error('🚨 Build failed:', error);
  process.exit(1);
});
