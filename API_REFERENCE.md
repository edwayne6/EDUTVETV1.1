# 🔧 API Endpoints Reference

**Base URL (Development):** `http://localhost:5000`

---

## 📤 Upload Endpoints

### **POST /api/documents/upload**

**Purpose:** Upload a new document with metadata

**Request:**
```
Method: POST
Content-Type: multipart/form-data
Body:
  - file: File (PDF, DOCX, PPTX) [REQUIRED]
  - title: string [REQUIRED] (max 300 chars)
  - description: string (max 5000 chars)
  - department: string [REQUIRED]
  - level: string
  - docType: string [REQUIRED]
  - submittedBy: string (defaults to "Admin")
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Document uploaded and published successfully!",
  "document": {
    "id": 4,
    "documentCode": "EDU-26-ABCDEF",
    "title": "Introduction to Python",
    "description": "Basic Python programming concepts",
    "department": "Computing & Informatics",
    "level": "Level 4",
    "docType": "Notes",
    "status": "published",
    "date": "2026-02-09",
    "fileName": "1707534000000-987654321.pdf",
    "submittedBy": "Admin",
    "fullText": "..."
  }
}
```

**Error Responses:**
```json
// 400 - Missing fields
{
  "success": false,
  "message": "Missing required fields: title, department, docType"
}

// 400 - No file
{
  "success": false,
  "message": "No file provided"
}

// 400 - Invalid type
{
  "success": false,
  "message": "Invalid file type. Allowed: PDF, DOCX, PPTX"
}

// 413 - File too large
{
  "success": false,
  "message": "File too large (max 10MB)"
}

// 500 - Server error
{
  "success": false,
  "message": "Error uploading document: ...",
  "error": "..."
}
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'My Document');
formData.append('department', 'Computing & Informatics');
formData.append('level', 'Level 5');
formData.append('docType', 'Notes');
formData.append('description', 'My description');

const response = await fetch('http://localhost:5000/api/documents/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.document.documentCode); // EDU-26-XXXXX
```

---

## 📥 Retrieval Endpoints

### **GET /api/documents/published**

**Purpose:** Get all published documents

**Request:**
```
Method: GET
No body required
```

**Response (200):**
```json
[
  {
    "id": 1,
    "documentCode": "EDU-26-ABCDEF",
    "title": "Crop Protection Guide",
    "department": "Agriculture",
    "level": "Level 5",
    "docType": "Notes",
    "status": "published",
    "date": "2025-01-20",
    "description": "...",
    "fileName": "1707533000000-123456789.pdf",
    "submittedBy": "System"
  },
  // ... more documents
]
```

**JavaScript Example:**
```javascript
const response = await fetch('http://localhost:5000/api/documents/published');
const documents = await response.json();
console.log(documents.length); // Number of documents
```

---

### **GET /api/documents/code/:code**

**Purpose:** Get document metadata by code

**Request:**
```
Method: GET
URL: http://localhost:5000/api/documents/code/EDU-26-ABCDEF
```

**Response (200):**
```json
{
  "id": 4,
  "documentCode": "EDU-26-ABCDEF",
  "title": "Introduction to Python",
  "department": "Computing & Informatics",
  "level": "Level 4",
  "docType": "Notes",
  "status": "published",
  "date": "2026-02-09",
  "description": "...",
  "fileName": "1707534000000-987654321.pdf",
  "submittedBy": "Admin"
}
```

**Error Response (404):**
```json
{
  "message": "Document not found with code: EDU-26-INVALID"
}
```

**JavaScript Example:**
```javascript
const code = 'EDU-26-ABCDEF';
const response = await fetch(`http://localhost:5000/api/documents/code/${code}`);
const document = await response.json();
console.log(document.title; // Document title
```

---

## 📥 Download Endpoints

### **GET /api/documents/code/:code/download**

**Purpose:** Download document by code

**Request:**
```
Method: GET
URL: http://localhost:5000/api/documents/code/EDU-26-ABCDEF/download
```

**Response (200):**
- Binary file content
- Content-Type: application/pdf (or appropriate type)
- Content-Disposition: attachment
- Browser automatically downloads file

**Error Response (404):**
```json
{
  "message": "Document or file not found with code: EDU-26-INVALID"
}
```

**HTML Example:**
```html
<a href="http://localhost:5000/api/documents/code/EDU-26-ABCDEF/download">
  Download Document
</a>
```

---

### **GET /api/documents/:id/download**

**Purpose:** Download document by ID

**Request:**
```
Method: GET
URL: http://localhost:5000/api/documents/4/download
```

**Response (200):**
- Binary file content
- File downloads with original title as filename

**Error Response (404):**
```json
{
  "message": "Document or file not found with ID: 99"
}
```

---

## 📊 Analytics Endpoints

### **GET /api/stats**

**Purpose:** Get visitor statistics

**Request:**
```
Method: GET
URL: http://localhost:5000/api/stats
```

**Response (200):**
```json
{
  "totalVisits": 42,
  "uniqueVisitors": 15,
  "recentVisits": [
    {
      "visitorId": "abc123def456...",
      "timestamp": "2026-02-09T12:34:56.000Z",
      "page": "/upload.html",
      "referrer": ""
    },
    // ... more visits
  ]
}
```

**JavaScript Example:**
```javascript
const response = await fetch('http://localhost:5000/api/stats');
const stats = await response.json();
console.log(`Total visits: ${stats.totalVisits}`);
```

---

## 🏥 Health Check

### **GET /api/health**

**Purpose:** Check if server is running

**Request:**
```
Method: GET
URL: http://localhost:5000/api/health
```

**Response (200):**
```json
{
  "status": "Server is running",
  "documentsCount": 5,
  "documentsFolder": "C:\\...\\documents",
  "ssrEnabled": false
}
```

**Use Case:** Verify server is up before uploading

---

## ⚙️ Request/Response Rules

### **All Requests:**
- ✅ Can be HTTP or HTTPS
- ✅ Content-Type validated
- ✅ CORS enabled for localhost
- ✅ Rate limited (300 req/min per IP)

### **All Responses:**
- ✅ JSON format unless file download
- ✅ Proper HTTP status codes
- ✅ Error messages included
- ✅ Timestamps in ISO 8601 format

### **File Uploads:**
- ✅ Max 10MB per file
- ✅ Allowed types: PDF, DOCX, PPTX
- ✅ Stored with timestamp-based names
- ✅ Original filename in metadata

### **Error Codes:**
```
200 - Success (GET requests)
201 - Created (POST upload)
400 - Bad request (missing fields, invalid file)
404 - Not found (invalid code/ID)
413 - Payload too large (file > 10MB)
500 - Server error (unexpected exception)
```

---

## 🔒 Security

### **CORS Policy:**
- ✅ Allows localhost (all variants)
- ✅ Allows same-origin requests
- ❌ Blocks other origins (by default)

### **File Validation:**
- ✅ MIME type checked
- ✅ Extension checked
- ✅ File size limited
- ✅ Uploaded to isolated folder

### **Input Validation:**
- ✅ Form fields sanitized
- ✅ Text length limited
- ✅ Special characters escaped
- ✅ No SQL injection possible

### **Rate Limiting:**
- ✅ 300 requests per minute per IP
- ✅ Prevents abuse
- ✅ Returns 429 if exceeded

---

## 📝 Document Code Format

**Format:** `EDU-YY-XXXXXX`

Example breakdown:
```
EDU        = Prefix (constant)
-          = Separator
26         = Last 2 digits of year (2026)
-          = Separator
ABCDEF     = 6 random alphanumeric characters
```

**Examples:**
- `EDU-26-JKMQRS` (2026, random)
- `EDU-27-WXYZ12` (2027, random)
- `EDU-25-ABCDEF` (2025, random)

**Uniqueness:** Virtually impossible to have duplicates

---

## 🔄 Complete Upload Workflow

```
1. User selects file (upload.html)
   ↓
2. Frontend validates form
   ↓
3. Frontend detects API URL (localhost:5000)
   ↓
4. Frontend sends POST /api/documents/upload
   ↓
5. Express receives multipart data
   ↓
6. Multer validates file (type, size)
   ↓
7. File saved to /documents/ folder
   ↓
8. Server generates unique code (EDU-26-XXXXX)
   ↓
9. Document metadata stored
   ↓
10. JSON response with code (201 created)
   ↓
11. Frontend displays code in success message
   ↓
12. User can download immediately or later
   ↓
13. Document appears in documents.html list
```

---

## 📞 API Usage Summary

| Scenario | Method | Endpoint | Use |
|----------|--------|----------|-----|
| Upload doc | POST | /api/documents/upload | Public users, admin |
| Get all docs | GET | /api/documents/published | documents.html page |
| Get one doc | GET | /api/documents/code/:code | Search by code |
| Download doc | GET | /api/documents/code/:code/download | Users download |
| Get stats | GET | /api/stats | Admin analytics |
| Server health | GET | /api/health | Monitoring |

---

## 🧪 Test API with Browser

### **GET Requests (copy/paste in address bar):**

```
Server health:
http://localhost:5000/api/health

All documents:
http://localhost:5000/api/documents/published

One document (example code):
http://localhost:5000/api/documents/code/EDU-26-ABCDEF

Download document:
http://localhost:5000/api/documents/code/EDU-26-ABCDEF/download

Statistics:
http://localhost:5000/api/stats
```

### **POST Request (use upload.html form):**
```
Use the upload form at:
http://localhost:5000/upload.html

Or curl command:
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "department=Computing & Informatics" \
  -F "level=Level 5" \
  -F "docType=Notes" \
  -F "description=Test document"
```

---

**Last Updated:** February 9, 2026  
**Verified:** All endpoints tested ✅
