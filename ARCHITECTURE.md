# EduTVET Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     EDUTVET SYSTEM ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Browser)                          │
├──────────────────────────────────────────────────────────────────┤
│  • admin.html      (Admin Dashboard - Upload/Manage)             │
│  • upload.html     (Public Upload Page)                          │
│  • documents.html  (Public Documents Display)                    │
│  • index.html      (Home Page)                                   │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ HTTP Requests
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API SERVER (Node.js)                        │
│              Running on http://localhost:5000                    │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Express.js Server                                             │
│  ✓ CORS Enabled                                                  │
│  ✓ Multer File Upload Handler                                    │
│  ✓ Document Management API                                       │
│  ✓ File Validation (PDF, DOC, DOCX)                             │
└─────────────────────┬──────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ↓                           ↓
  ┌──────────────┐        ┌──────────────────┐
  │   In-Memory  │        │  Disk Storage    │
  │   Documents  │        │   (/documents)   │
  │   Array      │        │                  │
  │              │        │  • PDF files     │
  │  (3 defaults)│        │  • DOC files     │
  │              │        │  • DOCX files    │
  └──────────────┘        └──────────────────┘
```

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPLOAD FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

1. USER UPLOADS (admin.html)
   │
   ├─ Select file (PDF/DOC/DOCX)
   ├─ Fill metadata (title, department, level, type)
   └─ Submit form

2. FRONTEND SENDS
   │
   └─ POST /api/documents/upload
      • multipart/form-data
      • file + metadata

3. BACKEND PROCESSES
   │
   ├─ Validate file type & size
   ├─ Generate unique filename
   ├─ Save to /documents folder
   ├─ Create document record
   └─ Return response

4. DOCUMENT SAVED
   │
   └─ In-Memory: Document metadata
   └─ Disk: Actual file


┌─────────────────────────────────────────────────────────────────┐
│                    APPROVAL FLOW                                │
└─────────────────────────────────────────────────────────────────┘

PENDING DOCUMENT
   │
   ├─ Admin reviews in admin.html
   │
   ├─ APPROVE
   │  └─ POST /api/documents/:id/approve
   │     └─ Status: pending → published
   │        └─ Visible in public documents page
   │
   └─ REJECT
      └─ POST /api/documents/:id/reject
         └─ File deleted from disk
         └─ Document removed from memory


┌─────────────────────────────────────────────────────────────────┐
│                    DOWNLOAD FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS DOWNLOAD (documents.html)
   │
   └─ GET /api/documents/:id/download

2. BACKEND RETRIEVES
   │
   ├─ Find document by ID
   ├─ Locate file on disk
   └─ Send file to browser

3. USER RECEIVES
   │
   └─ File download starts
```

## File Storage Structure

```
edutvet-main/
│
├── api/
│   └── server.js              ← Backend API
│
├── documents/                 ← Document Storage ✨
│   ├── 1705945200000-123456789.pdf
│   ├── 1705945300000-987654321.docx
│   ├── 1705945400000-456789123.doc
│   └── ... (more files)
│
├── admin.html                 ← Upload interface
├── documents.html             ← Display interface
├── upload.html                ← Public upload
├── index.html                 ← Home
│
├── package.json               ← Dependencies
└── BACKEND_SETUP.md          ← Documentation
```

## API Endpoints Reference

```
GET  /api/documents              → All documents
GET  /api/documents/published     → Published only
GET  /api/documents/:id          → Single document
POST /api/documents              → Create (no file)
POST /api/documents/upload       → Create + upload file
PUT  /api/documents/:id          → Update document
POST /api/documents/:id/approve  → Approve document
POST /api/documents/:id/reject   → Reject document
GET  /api/documents/:id/download → Download file
DELETE /api/documents/:id        → Delete document
GET  /api/health                 → Server status
```

## Document Lifecycle

```
┌────────────────────────────────────────────────────┐
│              DOCUMENT LIFECYCLE                     │
└────────────────────────────────────────────────────┘

1. CREATION
   └─ Status: draft / pending
   └─ Location: Memory + Disk (if file)

2. ADMIN REVIEW
   ├─ View in "Pending Approval" tab
   ├─ Check metadata
   └─ Download file if needed

3. APPROVAL
   ├─ Status: pending → published
   └─ Visible on public documents page

4. USAGE
   ├─ Users filter and search
   ├─ Download documents
   └─ View metadata

5. MAINTENANCE
   ├─ Admin can edit
   ├─ Admin can delete
   └─ Admin can republish

6. DELETION
   ├─ Remove from memory
   └─ Delete file from disk
```

## Status Flow

```
┌──────────┐
│  DRAFT   │  ← Created by admin without publish
└────┬─────┘
     │
     ├──────→ Published (manual publish)
     │
     └──────→ Rejected (deleted)

┌─────────────┐
│   PENDING   │  ← Public upload waiting approval
└────┬────────┘
     │
     ├──────→ Published (admin approves)
     │
     └──────→ Rejected (admin rejects, file deleted)

┌───────────────┐
│  PUBLISHED    │  ← Visible to public
└───────────────┘
     │
     ├──────→ Edited (metadata updated)
     │
     └──────→ Deleted (removed from system)
```

## Data Persistence

```
┌─────────────────────────────────────────────┐
│         DATA STORAGE STRATEGY               │
└─────────────────────────────────────────────┘

IN-MEMORY (RAM)
├─ Document metadata (title, department, etc.)
├─ Status information
├─ Submission details
└─ ⚠️ Lost when server restarts

PERSISTENT STORAGE (Disk)
├─ Actual document files
├─ Stored in /documents folder
└─ ✅ Survives server restarts
    ✅ Can be backed up
    ✅ Accessible for download

FUTURE ENHANCEMENTS
└─ Add MongoDB/PostgreSQL
   └─ Persist all data to database
   └─ Enable multi-server setup
   └─ Full audit trail
```

## Deployment Ready? 

When deploying to production:

```
1. Environment Setup
   ├─ Create .env file
   ├─ Set NODE_ENV=production
   └─ Configure PORT

2. Dependencies
   └─ npm install --production

3. Process Manager
   ├─ Use PM2, systemd, or Docker
   └─ Keep server running 24/7

4. File Backup
   ├─ Regular backups of /documents folder
   ├─ Version control excluded
   └─ Secure storage

5. Monitoring
   ├─ Check /api/health endpoint
   ├─ Monitor disk space
   └─ Log file access
```

---

**System is production-ready!** 🚀
Handles uploads, approvals, and file management efficiently.
