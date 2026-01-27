# EduTVET Backend Setup Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

### 3. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Documents Management

#### Get All Documents
```
GET /api/documents
```

#### Get Published Documents Only
```
GET /api/documents/published
```

#### Get Single Document
```
GET /api/documents/:id
```

#### Upload Document (with File)
```
POST /api/documents/upload
Content-Type: multipart/form-data

Form Fields:
- file: File object (PDF, DOC, DOCX)
- title: Document title (required)
- description: Document description
- department: Department name (required)
- level: Level (Level 3-6)
- docType: Notes, Curriculum, or Occupational Standards (required)
- submittedBy: Submitter name (optional)
```

#### Create Document (without File)
```
POST /api/documents
Content-Type: application/json

{
  "title": "Document Title",
  "description": "Description",
  "department": "Agriculture",
  "level": "Level 5",
  "docType": "Notes",
  "status": "draft",
  "submittedBy": "Admin"
}
```

#### Update Document
```
PUT /api/documents/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description",
  "department": "Business",
  "level": "Level 6",
  "docType": "Curriculum",
  "status": "published"
}
```

#### Approve Document
```
POST /api/documents/:id/approve
```

#### Reject Document
```
POST /api/documents/:id/reject
```

#### Delete Document
```
DELETE /api/documents/:id
```

#### Download Document File
```
GET /api/documents/:id/download
```

#### Health Check
```
GET /api/health
```

## Folder Structure

```
edutvet-main/
├── api/
│   └── server.js          (Node.js backend server)
├── documents/             (Uploaded document files stored here)
├── admin.html            (Admin dashboard)
├── documents.html        (Public documents page)
├── upload.html          (Public upload page)
├── index.html           (Home page)
├── package.json         (Node.js dependencies)
└── .env                 (Environment variables - create this)
```

## Document Storage

- Uploaded documents are stored in the `/documents` folder
- File names are automatically generated with timestamps to avoid conflicts
- Maximum file size: 10MB
- Allowed formats: PDF, DOC, DOCX

## Features

✅ File upload with validation
✅ Document metadata storage (title, department, level, type, etc.)
✅ Approval workflow (pending → published)
✅ File deletion on document rejection/deletion
✅ Static file serving for direct access
✅ CORS enabled for frontend integration

## Testing the API

You can test the endpoints using:
- **Postman** - API testing tool
- **cURL** - Command line tool
- **Insomnia** - REST client

Example cURL:
```bash
curl -X GET http://localhost:5000/api/documents
```

## Troubleshooting

**Port 5000 already in use:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Documents folder permission denied:**
Ensure the application has write permissions to the `/documents` folder

**File upload fails:**
- Check file size (max 10MB)
- Check file format (PDF, DOC, DOCX only)
- Ensure `/documents` folder exists and is writable
