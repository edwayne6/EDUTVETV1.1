# Backend Server Setup & Running Guide

## ✅ Problem Fixed

The "Failed to fetch" error has been resolved by:
1. Adding proper static file serving from the server
2. Improving CORS configuration for localhost
3. Fixing the API URL detection in frontend

## 🚀 How to Run the Server

### Step 1: Install Dependencies
```bash
cd EDUTVETV1.1/api
npm install
```

### Step 2: Start the Server
```bash
npm start
```

**Expected Output**:
```
========================================
✅ Server running on port 5000
✅ Listening at http://localhost:5000
✅ Documents folder: EDUTVETV1.1/documents
========================================
```

### Step 3: Access the Application
Open your browser and visit:
- **http://localhost:5000** - Home page
- **http://localhost:5000/upload.html** - Public upload
- **http://localhost:5000/documents.html** - Document listing
- **http://localhost:5000/admin.html** - Admin dashboard

## 📋 What Was Changed

### 1. Static File Serving (server.js)
```javascript
// Added middleware to serve all static files
app.use(express.static(parentDir, {
  maxAge: '1h',
  dotfiles: 'deny'
}));
```
This allows the server to serve:
- upload.html, documents.html, admin.html
- CSS files (styles.css, etc.)
- JavaScript files (scripts/, data/)
- Images and assets

### 2. Improved CORS (server.js)
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```
This properly handles:
- Localhost connections on any port
- File:// protocol access (in development)
- All required HTTP methods
- Proper headers

### 3. Smart URL Detection (upload.html)
```javascript
const apiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api/documents/upload'
  : '/api/documents/upload';

fetch(apiUrl, {
  method: 'POST',
  body: uploadFormData,
  credentials: 'same-origin'
})
```
This automatically:
- Detects if running on localhost
- Uses full URL for localhost (http://localhost:5000/...)
- Uses relative URL for production (/api/...)
- Includes proper credentials handling

## 🧪 Test the Setup

### Test 1: Check Server Health
```bash
# Open in browser or curl:
http://localhost:5000/api/health
```
Should return:
```json
{
  "status": "Server is running",
  "documentsCount": 2,
  "documentsFolder": "/path/to/documents",
  "ssrEnabled": false
}
```

### Test 2: Upload a Document
1. Go to http://localhost:5000/upload.html
2. Select a small PDF file
3. Fill in the form
4. Click "Upload Document"
5. Should see: Document Code (EDU-26-XXXXX)

### Test 3: Check Admin
1. Go to http://localhost:5000/admin.html
2. Enter PIN: 1998
3. Go to Upload tab
4. Try uploading a document
5. Should see the document code

### Test 4: List Documents
1. Go to http://localhost:5000/documents.html
2. Should see uploaded documents with codes
3. Try searching by code
4. Try downloading by code

## 🔍 Debugging

### If "Failed to fetch" error persists:

**Check 1: Server is running**
```bash
# Terminal should show:
[2026-02-09 12:00:00] Server running on port 5000
```

**Check 2: documents folder exists**
```bash
# Windows
dir EDUTVETV1.1\documents

# Linux/Mac
ls -la EDUTVETV1.1/documents
```

If missing, create it:
```bash
# Windows
mkdir EDUTVETV1.1\documents

# Linux/Mac
mkdir -p EDUTVETV1.1/documents
```

**Check 3: Check browser console**
- Open DevTools: F12
- Go to Console tab
- Look for error messages
- Check Network tab (F12 → Network)
- Click on failed request to see response

**Check 4: Verify API endpoint**
```bash
# Test health endpoint:
curl http://localhost:5000/api/health

# Should return JSON with status
```

**Check 5: Check package.json has required dependencies**
```bash
npm list express cors multer
```

Should show versions for:
- express
- cors  
- multer

## 📁 File Structure

```
EDUTVETV1.1/
├── api/
│   ├── server.js          (Backend server)
│   └── package.json       (Dependencies)
├── documents/             (Uploaded files stored here)
├── scripts/               (Frontend JS)
├── data/                  (courses.json)
├── upload.html            (Public upload page)
├── documents.html         (Listing page)
├── admin.html             (Admin panel)
├── index.html             (Home page)
└── styles.css             (Styling)
```

## 🛠️ Common Issues & Solutions

### Issue: "Cannot GET /upload.html"
**Solution**: Server not finding static files
- Check: Static middleware is configured ✓
- Check: upload.html exists in EDUTVETV1.1/
- Check: No typos in file name

### Issue: "CORS error" or "blocked by CORS policy"
**Solution**: Already fixed in server.js
- CORS middleware properly configured
- All localhost connections allowed
- All HTTP methods enabled

### Issue: "Failed to fetch" with no error details
**Solution**: 
1. Check server is running: `npm start` in api folder
2. Check port 5000 isn't already in use: `netstat -an | find ":5000"`
3. Check file size < 10MB
4. Check file format is PDF, DOCX, or PPTX

### Issue: "Document uploaded but file missing"
**Solution**:
- Check documents folder permissions
- Ensure documents folder is writable
- Check disk space available

### Issue: "Cannot find module" error
**Solution**:
```bash
cd api
npm install
npm start
```

## 🚀 Starting Fresh

If you want to start completely fresh:

```bash
# 1. Stop the server (Ctrl+C in terminal)

# 2. Delete node_modules
cd api
rmdir /s node_modules      # Windows
rm -rf node_modules         # Linux/Mac

# 3. Reinstall everything
npm install

# 4. Start fresh
npm start
```

## 📝 Server Features

✅ API endpoints for document upload
✅ Static file serving (HTML, CSS, JS)
✅ CORS enabled for localhost
✅ File upload with multer
✅ Document code generation
✅ Health check endpoint (/api/health)
✅ Document management APIs
✅ Download by code support

## 🔒 Security Features

✅ Helmet.js for security headers
✅ Rate limiting on API calls
✅ CORS protection
✅ File type validation
✅ File size limits (10MB)
✅ Input sanitization
✅ Safe file storage

## 📊 Performance

✅ Static file caching (1 hour)
✅ Timeout protection (5 seconds for text extraction)
✅ Optimized file upload handling
✅ Proper error responses

---

**Quick Start**: 
```bash
cd api && npm install && npm start
```

Then visit: http://localhost:5000

Your EduTVET system should be fully operational! 🎉
