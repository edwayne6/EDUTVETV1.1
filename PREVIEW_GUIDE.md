# Document Preview Feature Guide

## Overview

You can now preview documents directly in the admin dashboard:

- **PDF Files**: View inline with an embedded PDF viewer
- **Word Files (DOC/DOCX)**: Download link (cannot preview in browser)
- **Document Info**: See all metadata alongside the preview

---

## How to Use

### 1. Upload a Document

1. Go to **Admin Dashboard** (PIN: 1998)
2. Click **Upload Document** tab
3. Fill in:
   - Document Title
   - Description (optional)
   - Department
   - Level
   - Document Type
   - **Select a file** (PDF, DOC, or DOCX)
4. Click **Upload Document** or **Upload & Publish**

### 2. Preview a Document

1. Go to **Manage Documents** tab
2. Look for documents with a **Preview** button (👁️)
3. Click the **Preview** button to open the preview modal

### 3. Preview Modal Features

**For PDF Documents:**
- Full embedded PDF viewer
- See all document information
- Zoom and navigate pages
- Download option

**For Word Documents:**
- Message that preview is not available in browser
- Download button to view in Word/compatible software
- Full document information visible

### 4. Download Documents

From the preview modal:
1. Click the **Download** button
2. File will download with original name

Or from manage documents table:
- Use the download icon if your action buttons support it

---

## File Requirements

| Property | Requirements |
|----------|--------------|
| **File Type** | PDF, DOC, DOCX |
| **Max Size** | 10 MB |
| **Storage** | `/documents` folder on server |
| **Display Name** | Auto-generated with timestamp |

---

## Preview Modal Layout

```
┌─────────────────────────────────────────┐
│ Preview: [Document Title]          [X]  │
├─────────────────────────────────────────┤
│                                         │
│  PDF Preview (embedded iframe) or      │
│  Word Document Message                  │
│  (height: 600px)                       │
│                                         │
├─────────────────────────────────────────┤
│ Document Information Section:          │
│ Title: ...                              │
│ Department: ...  | Level: ...           │
│ Type: ...        | Status: ...          │
│ Date: ...                               │
│ Description: ...                        │
├─────────────────────────────────────────┤
│ [Download Button]  [Close Button]       │
└─────────────────────────────────────────┘
```

---

## Technical Details

### Backend Integration

**Upload Endpoint:**
- URL: `http://localhost:5000/api/documents/upload`
- Method: POST
- Stores files in `/documents` folder with timestamp
- Returns document object with `fileName` field

**Download Endpoint:**
- URL: `http://localhost:5000/api/documents/:id/download`
- Method: GET
- Serves file directly

**Preview Access:**
- URL: `http://localhost:5000/documents/[fileName]`
- CORS enabled for localhost

### File Storage

Files are saved with auto-generated names to avoid conflicts:

```
Uploaded: my-document.pdf
Stored as: 1705960234567-847234095.pdf
```

This timestamp-based naming ensures:
- ✅ No filename conflicts
- ✅ Easy tracking of upload time
- ✅ Unique identifiers

---

## Browser Compatibility

| Browser | PDF Preview | Word Download | Status |
|---------|-------------|---------------|--------|
| Chrome | ✅ Yes | ✅ Yes | Fully Supported |
| Firefox | ✅ Yes | ✅ Yes | Fully Supported |
| Safari | ✅ Yes | ✅ Yes | Fully Supported |
| Edge | ✅ Yes | ✅ Yes | Fully Supported |
| IE 11 | ⚠️ Limited | ✅ Yes | Not Recommended |

---

## Testing Workflow

### Test 1: Upload and Preview PDF
1. Prepare a PDF file
2. Upload via admin panel
3. Click Preview button
4. Verify PDF displays correctly
5. Click Download and verify file downloads

### Test 2: Upload and Preview Word Document
1. Prepare a DOCX file
2. Upload via admin panel
3. Click Preview button
4. Verify message about Word documents
5. Click Download and verify Word file opens

### Test 3: Search Filtering
1. Upload multiple documents
2. Use search box to filter
3. Preview buttons only show for documents with files
4. Verify filtering works correctly

---

## Troubleshooting

### Issue: "Preview button doesn't appear"
**Cause:** Document doesn't have a fileName (likely created before file upload support)
**Solution:** Delete and re-upload the document

### Issue: "PDF won't load in preview"
**Cause:** Server not running or CORS issue
**Solution:** 
1. Check server is running: `npm start`
2. Verify files exist in `/documents` folder
3. Check browser console for errors

### Issue: "Download doesn't work"
**Cause:** File path incorrect or server issue
**Solution:**
1. Verify file exists in `/documents` folder
2. Check console for error messages
3. Try downloading via direct URL: `http://localhost:5000/documents/[fileName]`

### Issue: "Word document shows in PDF viewer"
**Cause:** File extension detection issue
**Solution:**
1. Verify file extension is correct (.doc or .docx)
2. Check that file MIME type matches extension
3. Re-upload the document

---

## Future Enhancements

Potential improvements:

1. **Word Document Preview**
   - Use online converter (e.g., pdf.js for DOCX)
   - Embed viewer for better UX

2. **Thumbnail Generation**
   - Auto-generate document thumbnails
   - Display in document list

3. **Document Versioning**
   - Track multiple versions of same document
   - Allow rollback to previous versions

4. **Annotation**
   - Allow admins to mark up PDFs
   - Add comments to documents

5. **Batch Preview**
   - Preview multiple documents at once
   - Compare versions side-by-side

---

## API Reference

### Get Single Document
```
GET /api/documents/:id
Response: { id, title, department, level, docType, status, date, fileName, ... }
```

### Download Document
```
GET /api/documents/:id/download
Response: File (application/octet-stream)
```

### Access File Directly
```
GET /documents/[fileName]
Response: File stream (proper MIME type)
```

---

## Document Info Display

The preview modal shows:
- ✅ Title
- ✅ Department
- ✅ Level
- ✅ Document Type
- ✅ Status
- ✅ Upload Date
- ✅ Description

All information is populated from the backend database.

---

## Summary

**What's New:**
- Preview button (👁️) for documents with files
- Full PDF viewer embedded in modal
- Document information sidebar
- Easy download from preview modal
- Word document handling

**Supported Files:**
- PDF (view inline)
- DOCX (download to view)
- DOC (download to view)

**Quick Start:**
1. Start server: `npm start`
2. Open admin dashboard
3. Upload a PDF or Word document
4. Click the eye icon to preview
5. Use Download button to save

Happy previewing! 🚀
