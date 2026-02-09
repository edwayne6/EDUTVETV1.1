# Document Code System - Technical Implementation

## Overview
This document describes the technical implementation of the unique document code system in EduTVET.

## Backend Implementation (server.js)

### Code Generation Function
```javascript
function generateDocumentCode() {
  // Format: EDU-YYYY-XXXXXX where YYYY is year and XXXXXX is random alphanumeric
  const year = new Date().getFullYear().toString().slice(2); // Last 2 digits of year
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EDU-${year}-${randomPart}`;
}
```

**Features**:
- Generates codes in format: `EDU-26-A7K9M2`
- Year is automatically updated annually
- Random part uses base-36 encoding (0-9, A-Z)
- Collision probability is extremely low (36^6 = ~2.1 billion combinations)

### Database Schema Updates

Documents now include:
```javascript
{
  id: 1,
  documentCode: "EDU-26-A7K9M2",  // NEW: Unique identifier
  title: "Crop Protection Guide",
  description: "...",
  department: "Agriculture",
  level: "Level 5",
  docType: "Notes",
  status: "published",
  date: "2025-01-20",
  fileName: "1234567890-123456789.pdf",  // Server filename
  submittedBy: "Admin",
  fullText: "..."  // For search indexing
}
```

### API Endpoints

#### 1. Upload Document (with Code Generation)
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <binary file>
title: "Crop Protection Guide"
description: "Comprehensive guide..."
department: "Agriculture and Environmental studies"
level: "Level 5"
docType: "Notes"
submittedBy: "Admin"
```

**Response**:
```json
{
  "success": true,
  "message": "Document uploaded and published successfully!",
  "document": {
    "id": 42,
    "documentCode": "EDU-26-K3N5P8",
    "title": "Crop Protection Guide",
    ...
  }
}
```

#### 2. Get Document by Code
```http
GET /api/documents/code/EDU-26-K3N5P8
```

**Response**:
```json
{
  "id": 42,
  "documentCode": "EDU-26-K3N5P8",
  "title": "Crop Protection Guide",
  "department": "Agriculture",
  "level": "Level 5",
  "docType": "Notes",
  "description": "...",
  "date": "2025-01-26",
  "fileName": "1234567890-123456789.pdf",
  "status": "published"
}
```

#### 3. Download Document by Code
```http
GET /api/documents/code/EDU-26-K3N5P8/download
```

Returns the actual file from `/documents/` folder with proper headers:
```
Content-Disposition: attachment; filename="Crop Protection Guide.pdf"
Content-Type: application/pdf
```

#### 4. Get Published Documents (with codes)
```http
GET /api/documents/published
```

**Response**:
```json
[
  {
    "id": 1,
    "documentCode": "EDU-25-X9M2K1",
    "title": "Crop Protection Guide",
    ...
  },
  {
    "id": 2,
    "documentCode": "EDU-26-K3N5P8",
    "title": "Business Plans",
    ...
  }
]
```

## Frontend Implementation

### Upload Form (upload.html)

**Changed from localStorage to API**:
```javascript
// OLD: Save to localStorage
localStorage.setItem('pendingSubmissions', JSON.stringify(formData));

// NEW: Post to API
fetch('/api/documents/upload', {
  method: 'POST',
  body: uploadFormData  // FormData with file
})
.then(response => response.json())
.then(data => {
  const docCode = data.document.documentCode;
  // Display code to user with download link
})
```

**User Experience**:
1. User uploads file
2. System generates unique code: `EDU-26-A7K9M2`
3. Code displayed prominently to user
4. Download link available immediately
5. Code can be shared with others

### Documents Page (documents.html)

**API Integration**:
```javascript
// Try API first (server-side data)
const apiUrl = '/api/documents/published';
fetch(apiUrl)
  .then(res => res.json())
  .then(apiDocs => {
    allDocuments = apiDocs;  // Use API data
    displayDocuments();
  })
  .catch(() => loadFromStorage());  // Fallback to localStorage
```

**Code Display in Cards**:
```html
<div>
  <strong>Code:</strong> 
  <span class="code-badge">EDU-26-K3N5P8</span>
  <button onclick="copyToClipboard('EDU-26-K3N5P8')">
    <i class="fas fa-copy"></i>
  </button>
</div>
```

**Search Enhancement**:
```javascript
// Can now search by document code
const matchesSearch = query === '' || 
  doc.documentCode.toLowerCase().includes(query) ||
  doc.title.toLowerCase().includes(query);
```

**Download Links**:
```html
<a href="/api/documents/code/EDU-26-K3N5P8/download">
  Download
</a>
```

### Admin Panel (admin.html)

**Upload Enhancement**:
```javascript
fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.document) {
    const docCode = data.document.documentCode;
    alert(`Document Code: ${docCode}\nShare this with users for easy retrieval.`);
    navigator.clipboard.writeText(docCode);  // Auto-copy
  }
})
```

## File Storage Structure

```
documents/
├── 1234567890-123456789.pdf      (File 1 for EDU-26-K3N5P8)
├── 1234567891-123456790.docx     (File 2 for EDU-26-M7R2X4)
├── 1234567892-123456791.pptx     (File 3 for EDU-25-Q1W4E7)
└── ...
```

**Mapping**:
- Physical filename: `1234567890-123456789.pdf` (timestamp + random)
- Document code: `EDU-26-K3N5P8` (human-friendly identifier)
- Database links them via `fileName` and `documentCode` fields

## Data Flow Diagram

```
User Upload
    ↓
upload.html FormData
    ↓
POST /api/documents/upload
    ↓
server.js validateFiles()
    ↓
multer saves to /documents/
    ↓
generateDocumentCode()
    ↓
Create document object with code
    ↓
Save to documents[] array
    ↓
Return response with documentCode
    ↓
Display code to user
```

## Search Flow

```
User enters search term (code or title)
    ↓
filterDocumentsArray() 
    ↓
Check: title.includes(query) 
       OR description.includes(query)
       OR documentCode.includes(query)
    ↓
Return matching documents
    ↓
displayDocuments() renders with codes
    ↓
User can copy code or download
```

## Download Flow

```
User clicks Download (or uses code directly)
    ↓
GET /api/documents/code/{CODE}/download
    ↓
server.js finds document by documentCode
    ↓
Retrieves fileName from database
    ↓
Constructs filepath: /documents/{fileName}
    ↓
Validates file exists
    ↓
res.download() returns file
    ↓
File downloaded to user
```

## Error Handling

### Invalid Code
```javascript
app.get("/api/documents/code/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const doc = documents.find(d => d.documentCode === code);
  if (!doc) {
    return res.status(404).json({ 
      message: "Document not found with code: " + code 
    });
  }
  res.json(doc);
});
```

### Missing File
```javascript
const filePath = path.join(documentsFolder, doc.fileName);
if (!fs.existsSync(filePath)) {
  return res.status(404).json({ 
    message: "File not found on server" 
  });
}
```

### Invalid Format
```
// Only accepts:
- application/pdf
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document

// Extensions:
- .pdf
- .doc
- .docx
- .pptx
```

## Performance Considerations

1. **Code Generation**: O(1) - Simple string concatenation
2. **Code Lookup**: O(n) - Linear search through documents array
   - For large document sets, consider indexing by code
3. **File Serving**: Standard Express.js download - efficient for most cases
4. **Search**: O(n) - Filters all documents for matches
   - Could be optimized with database indexes

## Security Measures

1. **Code Uniqueness**: Pseudo-random generation makes codes unpredictable
2. **File Validation**: Whitelist only allowed MIME types
3. **Size Limits**: Maximum 10MB per file
4. **Path Traversal Protection**: Files stored in isolated `/documents/` folder
5. **Access Control**: Admin functions require PIN verification
6. **Content Moderation**: Text extraction checked before publication

## Future Enhancements

1. **Database Migration**: Replace in-memory array with persistent database
2. **Code Format Options**: Allow custom naming schemes
3. **Code Search Index**: Optimize code-based lookups
4. **Analytics**: Track downloads by code
5. **Expiration**: Optional code expiration for sensitive documents
6. **Custom Codes**: Admin option to specify custom codes
7. **QR Codes**: Generate QR code for easy mobile sharing
8. **Code Statistics**: View how many times code was used

## Backward Compatibility

- Old documents without codes are still accessible by ID
- Fallback download endpoint: `/api/documents/:id/download`
- Search works with or without codes
- System gracefully handles missing codes

## Code Examples for Integration

### JavaScript/Fetch
```javascript
// Get document by code
const code = 'EDU-26-K3N5P8';
const response = await fetch(`/api/documents/code/${code}`);
const doc = await response.json();
console.log(doc.title);

// Download by code
window.location.href = `/api/documents/code/${code}/download`;
```

### cURL
```bash
# Get document info
curl https://edutvet.com/api/documents/code/EDU-26-K3N5P8

# Download file
curl -O https://edutvet.com/api/documents/code/EDU-26-K3N5P8/download \
     -H "Accept: application/pdf"
```

### Python
```python
import requests

code = 'EDU-26-K3N5P8'
url = f'https://edutvet.com/api/documents/code/{code}'

# Get document info
response = requests.get(url)
doc = response.json()
print(f"Title: {doc['title']}")

# Download file
download_url = f'{url}/download'
response = requests.get(download_url)
with open(doc['title'] + '.pdf', 'wb') as f:
    f.write(response.content)
```

---

**Last Updated**: February 2026
**Version**: EduTVET Document Code System V1.0
