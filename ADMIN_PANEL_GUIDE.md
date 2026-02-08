# EduTVET Admin Panel — Complete Setup & Usage Guide

## Overview

You now have a **non-destructive, comprehensive admin panel** that lets you manage your entire site without touching source files. It includes:

✅ **Analytics & Visitor Tracking** — Track user sessions, time on site, downloads, and when documents are added  
✅ **Document Management** — Approve, publish, delete documents (stored in browser storage)  
✅ **Site Editing Tools** — Generate CSS snippets and HTML files for hero overlay, footer, legal pages  
✅ **File Upload** — Upload documents with fallback to local storage  
✅ **Import/Export** — Backup and restore all data as JSON  
✅ **Secure Access** — PIN-protected (default: `1998`)  

---

## How to Run the Admin Panel

### Quick Start

1. **Open a terminal** in the project root (`EDUTVETV1.1`)

2. **Start a local server** for the admin panel:

   **Option A: Using Python 3** (built-in, no install needed)
   ```powershell
   python -m http.server 8081 --directory admin-panel
   ```

   **Option B: Using npx http-server**
   ```powershell
   npx http-server admin-panel -p 8081
   ```

3. **Open in browser**: http://localhost:8081

4. **Enter PIN**: `1998` (or click "Demo Data" for sample data)

---

## What You Can Do

### 1. Dashboard
- Quick stats: Total documents, pending, published

### 2. Analytics Tab ⭐ NEW
**Track your entire site activity:**

- **Total Visitors** — Number of unique browser sessions
- **Avg Time on Site** — Average duration in seconds
- **Total Downloads** — Count of file downloads
- **Recent Activity Log** — Last 15 actions (downloads, page views, etc.)
- **Documents Added Timeline** — When docs were added, by whom, department, level
- **Session Details Table** — Detailed breakdown of each visitor session
  - Session ID, Duration, Pages visited, Activities count, Start time

**All data automatically collected from pages that include `scripts/tracker.js`**

### 3. Documents Tab
- Search/filter documents in localStorage
- Approve, publish, or delete documents
- Import/export as JSON

### 4. Upload Tab
- Upload new documents (attempts API, falls back to local storage)
- Store documents locally for later publishing

### 5. Site Editor Tab
- **Hero Overlay**: Adjust opacity (0–1 scale) with live preview
- Generate CSS snippets to copy or download
- Apply changes by pasting CSS into your `styles.css`

### 6. Footer Editor Tab
- Build and edit footer HTML
- Download as file to paste into `index.html`

### 7. Legal Pages Generator
- Create **Privacy Policy**, **Terms of Service**, and **Cookie Policy**
- Customize titles and content
- Download as standalone HTML files

### 8. Settings Tab
- **Export All Data** — Download backup JSON of all admin data
- **Clear Local Data** — Reset all stored documents (careful!)

---

## Enabling Analytics & Tracking

For the analytics dashboard to collect data, you **must include the tracker script** on all site pages.

### Add to Pages

Add this line in the `<head>` of each page:

```html
<script src="scripts/tracker.js"></script>
```

**Already added to:**
- `index.html` ✓
- `documents.html` ✓
- `upload.html` ✓
- `admin.html` ✓

**To add to department pages** (in `departments/` folder):

Add near the top of the `<head>`:
```html
<script src="../scripts/tracker.js"></script>
```

---

## What Gets Tracked

### Session Data
- Unique session ID
- Start time and duration
- All pages visited
- Referrer and user agent
- Activities performed

### Activities
- **Page Views** — Which pages were visited
- **Downloads** — File downloads with filename
- **Document Additions** — New courses/docs added with metadata
- **Form Submissions** — Upload attempts, searches, etc.

### Document Additions
When a document is added, the system records:
- Title
- Department (e.g., "Agriculture", "ICT")
- Level (e.g., "Level 3", "Level 4")
- Status (pending, published, draft)
- Timestamp with date and time
- Who added it (admin, system, user)

---

## Viewing Analytics

1. **Open admin panel** → http://localhost:8081
2. **Enter PIN** → `1998`
3. **Click "Analytics" tab**
4. See real-time stats and logs
5. **Export data** → Download as JSON for backup or analysis

---

## Custom Tracking

If you want to track additional user actions, use:

```javascript
// Track a custom activity
window.trackActivity('action_name', { details: 'optional data' });

// Example: Track a button click
document.getElementById('myButton').addEventListener('click', () => {
  window.trackActivity('button_click', { button: 'myButton' });
});

// Track document addition
window.trackDocumentAdded({
  title: 'New Course Title',
  department: 'Computing',
  level: 'Level 5',
  addedBy: 'admin'
});
```

---

## Changing the PIN

Edit `admin-panel/app.js`, line 2:

```javascript
const PIN = '1998';  // Change this
```

---

## Data Storage

All data is stored in **browser localStorage**:
- `adminDocuments` — Document metadata
- `pendingSubmissions` — Upload queue
- `edutvet_analytics` — Visitor stats and activity logs

**⚠️ Important:** localStorage has a limit of ~5–10MB per origin. For large-scale deployments, export analytics regularly or connect to a backend database.

---

## Integration with Backend (Optional)

The tracker script attempts to send session data to:
```
http://localhost:5000/api/analytics/session
```

If your Node.js server is running and has this endpoint, data will be persisted. Otherwise, it's stored locally.

To set up backend persistence:

1. Add this endpoint to your `api/server.js`:
   ```javascript
   app.post('/api/analytics/session', (req, res) => {
     const session = req.body;
     // Save to database
     res.json({ success: true });
   });
   ```

2. Restart the server
3. Analytics will now be saved to your database

---

## Troubleshooting

**Q: Admin panel won't load**
- Make sure you're running a local server on port 8081
- Check that `admin-panel/` folder exists and contains `index.html`, `app.js`, `styles.css`

**Q: No analytics showing**
- Verify tracker script is added to pages: `<script src="scripts/tracker.js"></script>`
- Visit the main site (index.html, documents.html) to generate sample data
- Check browser console for errors

**Q: PIN not working**
- Default PIN is `1998`
- Edit `admin-panel/app.js` to verify PIN setting

**Q: Data not persisting**
- Analytics are stored in localStorage—they persist across browser sessions
- To backup, export regularly in the Settings tab

---

## Next Steps

1. ✅ Add tracker script to any remaining pages
2. ✅ Visit your site to generate sample analytics data
3. ✅ View analytics in admin panel
4. ✅ Export data regularly as backup
5. ✅ Use site editor to make CSS/footer/legal changes
6. ✅ Optional: Connect to backend for persistent storage

---

## Questions or Issues?

- Check `admin-panel/README.md` for more details
- Review `scripts/tracker.js` for tracking implementation
- All changes are non-destructive—nothing modifies your existing files automatically
