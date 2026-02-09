# Document Code System - User Guide

## Overview
The EduTVET Document Management System now includes a **unique document code system** that makes it easy to store, retrieve, and download documents. Each uploaded document receives a unique identifier code that never changes.

## How Document Codes Work

### What is a Document Code?
- **Format**: `EDU-YY-XXXXXX` (e.g., `EDU-26-A7K9M2`)
  - `EDU` = EduTVET identifier
  - `YY` = Current year (last 2 digits)
  - `XXXXXX` = Random alphanumeric string
- **Uniqueness**: Each document gets a unique code when uploaded
- **Stability**: The code never changes, ensuring consistent retrieval

## For Students/Public Users

### Uploading Documents
1. Go to **Upload** page
2. Fill in the form:
   - File upload (auto-populates title)
   - Document title
   - Department
   - Training level
   - Course (optional)
   - Document type
   - Brief description
3. Click **Upload Document**
4. **Your Document Code Will Appear** - Copy and save it!
5. You can download immediately or use the code later

### Finding Documents
1. Go to **Documents** page
2. Use the search bar to find documents by:
   - Title
   - Description
   - Department name
   - **Document Code** (paste the code you saved)
3. Files display with their codes visible
4. Click download to get the file

### Downloading Documents
- **Option 1**: Find the document and click **Download**
- **Option 2**: Search for the document code in the search bar, then download
- Files are stored in the `documents/` folder and ready for immediate download

## For Administrators

### Uploading Documents
1. Access **Admin Dashboard** (Enter PIN)
2. Go to **Upload** tab
3. Upload file (select from documents folder)
4. Form auto-populates title from filename
5. Fill in remaining details
6. Click **Upload & Publish**
7. **Document Code is displayed** - share with stakeholders

### Managing Documents
- View all uploaded documents with their codes
- Edit document details (title, description, etc.)
- Approve/reject pending public submissions
- Delete documents if needed
- Monitor document analytics

### Document Storage
- All files are saved in: `/documents/` folder
- Files are accessible via API endpoints
- Documents are indexed and searchable
- Each document has a unique code for easy retrieval

## API Endpoints

### Public Access
- **Get document by code**: `/api/documents/code/{CODE}`
- **Download by code**: `/api/documents/code/{CODE}/download`
- **Get all published documents**: `/api/documents/published`

### Admin Access
- **Upload document**: `POST /api/documents/upload`
- **Get all documents**: `/api/documents`
- **Get document by ID**: `/api/documents/{ID}`
- **Download by ID**: `/api/documents/{ID}/download`

### Example Usage
```bash
# Get document info by code
curl https://edutvet.com/api/documents/code/EDU-26-A7K9M2

# Download document by code
curl -O https://edutvet.com/api/documents/code/EDU-26-A7K9M2/download
```

## Key Features

✓ **Unique Codes**: Every document gets a unique, unchanging identifier
✓ **Local Storage**: Documents stored in `/documents/` folder on server
✓ **Easy Retrieval**: Search by code, title, department, or type
✓ **Quick Downloads**: Direct download links with actual file serving
✓ **Copy Functionality**: Click icon to copy document code to clipboard
✓ **Multi-Search**: Find documents by code, title, or other metadata
✓ **API Ready**: Endpoints available for programmatic access

## Workflow Examples

### Example 1: Student Uploads and Shares Notes
1. Student uploads "Crop Production Notes" (PDF)
   - System generates code: `EDU-26-K3N5P8`
   - Student saves the code
2. Student shares code with classmates: "EDU-26-K3N5P8"
3. Classmates go to Documents page
4. Paste code in search: `EDU-26-K3N5P8`
5. Document appears with download option
6. Click download to get the file

### Example 2: Trainer Publishes Curriculum
1. Trainer logs into admin dashboard
2. Uploads curriculum document
3. System auto-generates code: `EDU-26-M7R2X4`
4. Trainer notes the code and shares with students
5. Students can find and download using the code
6. Code is permanent - never changes

### Example 3: Retrieving Old Documents
1. Student saved code from 3 months ago: `EDU-25-Q1W4E7`
2. Student goes to Documents page
3. Pastes code in search bar
4. Document appears with download ready
5. Download the file directly

## Troubleshooting

### Document Code Not Appearing After Upload?
- Refresh the page
- Check browser console for errors
- Ensure backend API is running (`npm start`)

### Download Not Working?
- Check that documents folder exists: `/documents/`
- Verify file was uploaded successfully
- Try downloading via direct link: `/api/documents/code/{CODE}/download`

### Can't Find Document by Code?
- Ensure code is spelled correctly (case-insensitive)
- Code format should be: `EDU-YY-XXXXXX`
- Document must be published (not draft or pending)

### Need Admin File Access?
- Log in with correct PIN
- Go to Documents tab
- Search by code or title
- View, edit, delete, or approve documents

## Best Practices

1. **Save Your Code**: Save the document code immediately after upload
2. **Share the Code**: Share codes with colleagues and students for easy access
3. **Descriptive Titles**: Use clear titles that help identify documents
4. **Organize by Department**: Use department filters to find related documents
5. **Regular Updates**: Delete outdated documents to keep library current
6. **Document Types**: Assign correct type (Notes, Curriculum, etc.) for better organization

## System Architecture

```
EduTVET Document System
├── Frontend
│   ├── upload.html (Public upload with code display)
│   ├── admin.html (Admin dashboard with code generation)
│   └── documents.html (Search and download with code support)
├── Backend API
│   └── /api/documents/upload (Multipart file upload)
│   └── /api/documents/code/{CODE} (Code-based retrieval)
│   └── /api/documents/code/{CODE}/download (Code-based download)
└── File Storage
    └── /documents/ (File storage directory)
```

## Security

- **File Validation**: Only PDF, DOCX, PPTX files allowed
- **Size Limit**: Maximum 10MB per file
- **Access Control**: Admin requires PIN verification
- **Content Moderation**: Uploads checked before publication
- **Code Format**: Codes are pseudo-random and unique

## Support

For issues or questions about the document code system:
1. Check this guide
2. Review error messages
3. Contact administrator
4. Check server logs for detailed errors

---

**Last Updated**: February 2026
**System Version**: EduTVET V1.1 with Document Code System
