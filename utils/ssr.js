/**
 * Server-Side Rendering (SSR) Utilities
 * Handles dynamic rendering of pages with data from server
 */

const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const VIEWS_DIR = path.join(__dirname, '../views');

/**
 * Render a dynamic page with data
 * Uses caching to avoid re-rendering the same content
 */
async function renderPage(templateName, data, cacheKey = null) {
  try {
    // Check cache if key provided
    if (cacheKey && global.renderCache && global.renderCache[cacheKey]) {
      console.log(`📦 Cache HIT for ${templateName}`);
      return global.renderCache[cacheKey];
    }

    console.log(`🔄 Rendering ${templateName}...`);

    const templatePath = path.join(VIEWS_DIR, `${templateName}.ejs`);
    const layoutPath = path.join(VIEWS_DIR, 'layout.ejs');

    // Verify templates exist
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    if (!fs.existsSync(layoutPath)) {
      throw new Error(`Layout not found: ${layoutPath}`);
    }

    // Read files
    const pageContent = fs.readFileSync(templatePath, 'utf8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Render page content first
    const renderedContent = await ejs.render(pageContent, data, {
      filename: templatePath,
      views: [VIEWS_DIR],
      cache: true
    });

    // Render layout with page content
    const finalHtml = await ejs.render(layoutContent, {
      ...data,
      body: renderedContent
    }, {
      filename: layoutPath,
      views: [VIEWS_DIR],
      cache: true
    });

    // Cache result if key provided
    if (cacheKey) {
      if (!global.renderCache) {
        global.renderCache = {};
      }
      global.renderCache[cacheKey] = finalHtml;
      console.log(`✅ Cached: ${cacheKey}`);
    }

    return finalHtml;
  } catch (error) {
    console.error(`Error rendering ${templateName}:`, error);
    throw error;
  }
}

/**
 * Clear render cache
 */
function clearRenderCache() {
  global.renderCache = {};
  console.log('🗑️  Render cache cleared');
}

/**
 * Middleware to enable SSR for specific routes
 */
function ssrMiddleware(req, res, next) {
  // Add SSR render function to response
  res.renderSSR = async (template, data, cacheKey = null) => {
    try {
      const html = await renderPage(template, data, cacheKey);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(html);
    } catch (error) {
      console.error('SSR Error:', error);
      res.status(500).json({ error: 'Failed to render page' });
    }
  };

  next();
}

module.exports = {
  renderPage,
  clearRenderCache,
  ssrMiddleware,
  VIEWS_DIR
};
