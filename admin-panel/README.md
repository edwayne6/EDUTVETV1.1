# EduTVET — Standalone Admin Panel

This is a non-destructive, standalone admin UI that manages site data in-browser and generates editable snippets and files you can paste into the existing site.

## Features

- **Document Management**: Approve, publish, delete documents stored in localStorage
- **Analytics & Tracking**: Track visitor sessions, time on site, downloads, and document additions
- **Site Editor**: Generate CSS snippets for hero overlay opacity adjustments
- **Footer Builder**: Edit and download footer HTML
- **Legal Pages Generator**: Create privacy policy, terms of service, and cookie policy HTML files
- **Import/Export**: Backup and restore all admin data
- **Session Management**: PIN-protected admin interface

## How to run locally (quick)

1. From the repository root run a static server, e.g. using Python 3:

```powershell
python -m http.server 8081 --directory admin-panel
```

Or using `npx` http-server:

```powershell
npx http-server admin-panel -p 8081
```

2. Open http://localhost:8081 in your browser.

3. **Default PIN**: `1998` (edit in `app.js` line 4 to change)

## Tracking & Analytics

The admin panel automatically collects analytics when you include `scripts/tracker.js` in your site pages:

```html
<script src="scripts/tracker.js"></script>
```

The tracker records:
- **Visitor Sessions**: Start time, duration, pages visited, referrer
- **User Activities**: Downloads, form submissions, page navigation
- **Document Timeline**: When documents were added, by whom, department, and level
- **Activity Log**: Timestamped list of all user actions

All data is stored in browser `localStorage` under the key `edutvet_analytics`.

## Notes

- The panel does not auto-edit existing HTML/CSS files. It generates snippets and downloadable files to apply changes safely.
- It reads/writes `localStorage` keys `adminDocuments` and `pendingSubmissions` used by the site, so changes will be visible to pages that read from those keys.
- Tracking data persists in the browser and can be exported as JSON for archival or analysis.

## Integration Tips

1. **Include tracker on all site pages** for comprehensive analytics
2. **Track custom actions** using `window.trackActivity('action_name', { details })`
3. **Track document additions** using `window.trackDocumentAdded({ title, department, level, ... })`
4. **Export analytics regularly** to avoid exceeding localStorage limits (~5-10MB per origin)
