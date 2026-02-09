# CSS Optimization & Unused Styles Removal Guide

## Overview

This guide explains how to remove unused Tailwind CSS classes and optimize your stylesheet for production. Unused styles can bloat your CSS file significantly, impacting performance.

---

## Current State

### **Before Optimization**
- Tailwind generates **~3000+ utility classes** by default
- Unoptimized `styles.css` can be **200-400 KB**
- All utilities loaded even if not used in project

### **After Optimization**
- Only used classes included in final CSS
- Potential reduction: **60-80%** of CSS file size
- Production `styles.min.css` typically **30-80 KB**

---

## How It Works

### **1. Content Purging (tailwind.config.js)**

Tailwind scans template files to identify used classes:

```javascript
content: [
  './index.html',
  './views/**/*.ejs',
  './scripts/**/*.js',
  // ... all template files
]
```

**How it works:**
1. Tailwind reads all files in `content` paths
2. Scans for Tailwind class names (regex matching)
3. Only generates CSS for found classes
4. Discards all unused utilities

---

## Configuration

### **Updated tailwind.config.js**

✅ Already configured with:

**Content Paths:**
- All HTML files in root
- All EJS templates in `views/`
- Department pages in `departments/`
- JavaScript files in `scripts/`

**Safelist:**
- Dynamically generated colors
- Custom component classes
- Animation classes

**Extended Theme:**
- Custom animations already defined
- Common variants configured

---

## Usage

### **Analyze Current CSS Usage**

```bash
npm run analyze:css
```

**Output:**
```
🔍 Analyzing CSS Usage...

📂 Scanning 23 files...

📊 Top CSS Utility Prefixes Used
==================================================
flex                         15 classes
grid                         14 classes
bg                           12 classes
text                          9 classes
...

📈 Statistics
Total unique classes used: 287
Total Tailwind utilities: ~3,000+

Coverage: ~9.57%
Unused: ~90.43%
```

This shows ~90% of Tailwind is unused (expected - you only use what you need).

### **Build Optimized CSS**

```bash
node build/build-css.js
```

Or use npm script:

```bash
npm run build:css
```

**Output:**
```
📦 Processing with PostCSS...
✅ PostCSS build complete

📊 CSS Optimization Report
==================================================
Original Size:    250.45 KB
Optimized Size:   38.73 KB
Reduction:        84.5%
```

### **Full Production Build**

```bash
npm run build
```

Runs:
1. SSG (build:ssg)
2. CSS optimization (build:css)
3. Creates optimized `dist/` folder

---

## File Structure

```
build/
├── tailwind-base.css          # Base Tailwind imports & custom components
├── build-css.js               # CSS optimization build script
├── analyze-unused-css.js      # CSS usage analyzer
└── ssg.js                     # Static site generation

postcss.config.js              # PostCSS configuration (minification)
tailwind.config.js             # Tailwind configuration with content purging
```

---

## Configuration Details

### **tailwind.config.js**

**Content Paths:**
```javascript
content: [
  './index.html',              // Root files
  './admin.html',
  './documents.html',
  
  './departments/**/*.html',   // Department pages
  './views/**/*.ejs',          // EJS templates
  './scripts/**/*.js',         // Dynamic classes in JS
]
```

**Safelist (preserved regardless of usage):**
```javascript
safelist: [
  // Color utilities with all variants
  { pattern: /^bg-(blue|green|red)-(50|100|200|...)$/ },
  
  // Custom classes
  'animate-on-scroll',
  'badge',
  'document-card',
]
```

### **postcss.config.js**

**Production optimization:**
```javascript
// Automatically minifies CSS in production
NODE_ENV=production → minifies output
NODE_ENV=development → generates source maps
```

---

## Best Practices

### **✅ DO:**

1. **Keep content paths updated when adding files**
   ```javascript
   // If you add new template files, update content paths
   content: [
     // existing...
     './new-folder/**/*.ejs'  // Add new paths
   ]
   ```

2. **Use @layer for custom components**
   ```css
   @layer components {
     .my-button {
       @apply bg-blue-600 text-white px-4 py-2 rounded;
     }
   }
   ```

3. **Use safelist for dynamic classes**
   ```javascript
   safelist: [
     { pattern: /^bg-.*/ }  // Keep all bg colors
   ]
   ```

4. **Optimize images and assets**

5. **Monitor file sizes in production**

### **❌ DON'T:**

1. **Don't use string interpolation for classes**
   ```javascript
   // ❌ Bad - can't be detected by purge
   const color = colors[index];
   <div className={`bg-${color}-500`}>
   
   // ✅ Good - explicitly list classes
   <div className={color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}>
   ```

2. **Don't forget dynamic classes**
   - Add to safelist if generated at runtime
   - Document any class generation logic

3. **Don't ignore unused CSS warnings**

---

## How to Use in Your Project

### **Development**

During development, all Tailwind utilities are available (dev mode uses full Tailwind):

```bash
npm run dev
# Full Tailwind utilities available
# Can use any class without optimization overhead
```

### **Production Build**

When deploying, optimize CSS:

```bash
# Option 1: Just CSS
npm run build:css

# Option 2: Full build (SSG + CSS)
npm run build
```

**Result:**
- `/dist/styles.min.css` - Optimized CSS (~30-80 KB)
- `/dist/index.html` - SSG pages
- Build report in `/dist/build-report.json`

---

## Monitoring & Metrics

### **CSS Size Tracking**

Track CSS file sizes across builds:

```bash
# Check original size
ls -lh styles.css

# Check optimized size
ls -lh dist/styles.min.css

# Compare
du -sh dist/styles.min.css
```

### **Build Report**

Generated at `dist/build-report.json`:
```json
{
  "timestamp": "2026-02-09T12:00:00Z",
  "originalSize": "250.45 KB",
  "optimizedSize": "38.73 KB",
  "reduction": "84.5%",
  "output": "dist/styles.min.css"
}
```

### **Performance Impact**

Expected improvements:
- **Load Time:** 2-3 seconds → 600-800ms
- **Time to Interactive:** Significantly faster on mobile
- **Lighthouse Score:** Improved by 15-25 points

---

## Troubleshooting

### **Issue: Classes removed but still needed**

**Symptom:** Styles disappear after build

**Fix:** Add to safelist in `tailwind.config.js`
```javascript
safelist: [
  'my-removed-class',
  { pattern: /^my-pattern-.*/ }
]
```

### **Issue: Dynamic classes not working**

**Symptom:** Classes generated at runtime don't work

**Fix:** Use template literals instead of concatenation
```javascript
// ❌ Won't work - can't be analyzed
<div class="bg-{{ color }}-500">

// ✅ Works - class is literal string
<div class="bg-blue-500">
```

### **Issue: Build larger than expected**

**Symptom:** `styles.min.css` still too large

**Fix:** 
1. Check content paths are correct
2. Run `npm run analyze:css` to see what's used
3. Remove unused template files from content paths
4. Check for duplicate/dead code

---

## Advanced Optimization

### **Tree-shaking Unused Animations**

Remove animation classes not used:

```javascript
// In tailwind.config.js
extend: {
  animation: {
    'fade-in': 'fadeIn 0.6s ease-out',
    // Remove animations not used in templates
  }
}
```

### **Extracting Components**

Move repeated patterns to @layer components:

```css
@layer components {
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  
  .btn {
    @apply px-4 py-2 rounded font-semibold transition;
  }
}
```

Usage:
```html
<div class="card">...</div>
<button class="btn btn-primary">Click</button>
```

Reduces HTML class bloat and CSS output.

---

## Deployment Checklist

- [ ] Run `npm run build:css` before deploy
- [ ] Check `dist/styles.min.css` file size
- [ ] Compare with previous build
- [ ] Update CSS link in production server
- [ ] Test all pages render correctly
- [ ] Check for missing styles
- [ ] Monitor Lighthouse scores
- [ ] Compare load times

---

## Summary

| Task | Command | Result |
|------|---------|--------|
| Analyze usage | `npm run analyze:css` | View CSS statistics |
| Build optimized CSS | `npm run build:css` | Create minified CSS |
| Full production build | `npm run build` | SSG + CSS optimization |

---

## Related Documentation

- [Tailwind CSS Purging](https://tailwindcss.com/docs/content-configuration)
- [PostCSS Documentation](https://postcss.org/)
- [Performance Optimization Guide](../DEPLOYMENT_SUMMARY.txt)

---

**Version:** 1.0  
**Last Updated:** 2026-02-09
