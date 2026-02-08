# Quick Start — Admin Panel & Analytics

## ⚡ Get Started in 30 Seconds

### 1. Start the Admin Panel
Open PowerShell and run:

```powershell
cd "c:\Users\edu\Desktop\edutvet-main\EDUTVETV1.1"
python -m http.server 8081 --directory admin-panel
```

### 2. Open in Browser
Click or paste: **http://localhost:8081**

### 3. Enter PIN
Default PIN: **1998**

---

## What You Can Do Right Now

### View & Manage Documents
- **Documents tab** → Search, approve, delete, export documents
- All changes saved to browser storage automatically

### Track Visitor Activity ⭐ NEW
- **Analytics tab** → See:
  - How many visitors (unique sessions)
  - How long they stayed
  - What they downloaded
  - When documents were added
  - Full activity timeline with timestamps

### Customize Your Site (Non-Destructive)
- **Site Editor** → Adjust hero overlay opacity → Copy CSS → Paste into `styles.css`
- **Footer Editor** → Build footer HTML → Download → Paste into `index.html`
- **Legal Pages** → Generate Privacy Policy, Terms, Cookie Policy → Download as HTML files

### Backup Your Data
- **Settings** → Click "Export All Data" → Save JSON file

---

## Analytics Are Automatically Collected

✅ Already enabled on:
- `index.html`
- `documents.html`
- `upload.html`
- `admin.html`

**To track department pages**, add this one line to each:
```html
<script src="../scripts/tracker.js"></script>
```

---

## What Gets Tracked

| Data | Details |
|------|---------|
| **Sessions** | Visitor ID, start time, duration, pages viewed |
| **Downloads** | What file, when, from which page |
| **Document Additions** | Title, department, level, exact timestamp |
| **Activities** | Clicks, uploads, form submissions |

---

## Export Analytics for Analysis

1. Open admin panel → **Analytics tab**
2. Click **"Export Analytics"**
3. Save JSON file with data
4. Import into Excel, Google Sheets, or analysis tool

---

## Change the PIN

Edit `admin-panel/app.js`, line 2:
```javascript
const PIN = '1998';  // Change to your PIN
```

---

## Need Help?

- Read: `ADMIN_PANEL_GUIDE.md` (full documentation)
- Or: `admin-panel/README.md` (technical details)

---

## One More Thing

**To collect more analytics from department pages**, run this command:

```powershell
# Add tracker to all department pages
Get-ChildItem "departments/*.html" | ForEach-Object {
  (Get-Content $_.FullName) -replace '(<script src=")', '<script src="../scripts/tracker.js"></script>$1' | Set-Content $_.FullName
}
```

Then refresh the admin panel analytics to see data from all department pages!
