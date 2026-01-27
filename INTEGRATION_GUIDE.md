# Frontend Integration Guide

## Overview

Your frontend pages are currently using **localStorage** to store documents. To fully use the Node.js backend, update the pages to send API requests to the server.

---

## 1. Admin Upload Integration

### Current Behavior (localStorage)
Documents stored locally in browser only.

### New Behavior (with Backend)
Documents uploaded to server and saved to `/documents` folder.

### Update Required in `admin.html`

In the `uploadNewDocument()` function, change:
```javascript
// OLD (localStorage)
documents.push(newDoc);
alert('Document uploaded successfully!');
document.getElementById('uploadForm').reset();
saveDocumentsToSession();
loadAllData();

// NEW (Backend API)
const formData = new FormData();
formData.append('title', title);
formData.append('description', description);
formData.append('department', department);
formData.append('level', level);
formData.append('docType', docType);
formData.append('file', document.getElementById('fileInput').files[0]);

fetch('http://localhost:5000/api/documents/upload', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  alert(data.message);
  document.getElementById('uploadForm').reset();
  loadAllData(); // Reload from server
})
.catch(err => alert('Upload failed: ' + err.message));
```

---

## 2. Document Display Integration

### Current Behavior
Loads from localStorage/sessionStorage.

### New Behavior
Fetches from server API.

### Update in `documents.html`

Replace the `loadDocuments()` function:
```javascript
// NEW (Backend API)
function loadDocuments() {
  fetch('http://localhost:5000/api/documents/published')
    .then(res => res.json())
    .then(data => {
      allDocuments = data;
      populateDropdowns();
      displayDocuments();
    })
    .catch(err => {
      console.log('Error loading documents:', err);
      allDocuments = [];
      displayDocuments();
    });
}
```

---

## 3. Admin Document Management

### Delete Documents
Update `deleteDocument()` in admin.html:
```javascript
// NEW (Backend API)
function deleteDocument(id) {
  if (confirm('Are you sure you want to delete this document?')) {
    fetch(`http://localhost:5000/api/documents/${id}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAllData(); // Reload from server
    })
    .catch(err => alert('Delete failed: ' + err.message));
  }
}
```

### Approve Documents
Update `approveDocument()` in admin.html:
```javascript
// NEW (Backend API)
function approveDocument(id) {
  fetch(`http://localhost:5000/api/documents/${id}/approve`, {
    method: 'POST'
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadAllData(); // Reload from server
  })
  .catch(err => alert('Approval failed: ' + err.message));
}
```

### Reject Documents
Update `rejectDocument()` in admin.html:
```javascript
// NEW (Backend API)
function rejectDocument(id) {
  if (confirm('Are you sure you want to reject this document?')) {
    fetch(`http://localhost:5000/api/documents/${id}/reject`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAllData(); // Reload from server
    })
    .catch(err => alert('Rejection failed: ' + err.message));
  }
}
```

### Load All Admin Data
Replace `loadAllData()`:
```javascript
// NEW (Backend API)
function loadAllData() {
  fetch('http://localhost:5000/api/documents')
    .then(res => res.json())
    .then(data => {
      documents = data;
      updateDashboard();
      loadDocuments();
      loadPendingDocuments();
      loadDepartmentCounts();
      loadAnalytics();
    })
    .catch(err => console.log('Error loading data:', err));
}
```

---

## 4. File Download

### Add Download Link
In document cards, change download button:
```html
<!-- OLD -->
<a href="#" class="text-blue-600 hover:underline">Download</a>

<!-- NEW -->
<a href="http://localhost:5000/api/documents/${doc.id}/download" 
   class="text-blue-600 hover:underline" 
   download>Download</a>
```

---

## 5. Error Handling Pattern

Add error handling to all API calls:
```javascript
fetch(url, options)
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    // Success handling
  })
  .catch(error => {
    console.error('API Error:', error);
    alert('Operation failed: ' + error.message);
  });
```

---

## 6. API Base URL Configuration

Create a config at top of each file:
```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Usage:
fetch(`${API_BASE_URL}/documents`)
fetch(`${API_BASE_URL}/documents/upload`, options)
fetch(`${API_BASE_URL}/documents/${id}/approve`, options)
```

---

## 7. Upload with Progress (Optional)

For better UX, show upload progress:
```javascript
function uploadNewDocument() {
  const formData = new FormData(document.getElementById('uploadForm'));
  
  fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    alert('Upload successful!');
    loadAllData();
  })
  .catch(err => {
    console.error('Upload failed:', err);
    alert('Upload failed: ' + err.message);
  });
}
```

---

## 8. Local vs Server Persistence

### Key Difference
```
LOCAL STORAGE
├─ Data: Only in browser memory
├─ Persistence: Lost on page refresh
├─ Scope: Single browser only
└─ Good for: Testing, temporary data

SERVER STORAGE
├─ Data: Saved on disk
├─ Persistence: Survives restarts
├─ Scope: All users, all devices
└─ Good for: Production, shared data
```

---

## 9. Testing Integration

### Test Workflow
1. Start server: `npm start`
2. Verify health: `http://localhost:5000/api/health`
3. Open admin.html
4. Upload a document
5. Refresh page → Document still there ✓
6. Check `/documents` folder → File exists ✓
7. Go to documents.html → Document visible ✓
8. Click download → File downloads ✓

---

## 10. Common Issues & Solutions

### Issue: "Failed to fetch" error
**Solution:** Make sure server is running on port 5000

### Issue: "CORS error"
**Solution:** Server already has CORS enabled, but check browser console

### Issue: "File not found after upload"
**Solution:** Check that `/documents` folder exists and is writable

### Issue: "404 on download"
**Solution:** Verify file exists in `/documents` folder

---

## Migration Checklist

- [ ] Start backend server (`npm start`)
- [ ] Update `loadDocuments()` in documents.html
- [ ] Update `loadAllData()` in admin.html
- [ ] Update `uploadNewDocument()` in admin.html
- [ ] Update `deleteDocument()` in admin.html
- [ ] Update `approveDocument()` in admin.html
- [ ] Update `rejectDocument()` in admin.html
- [ ] Add download links
- [ ] Test upload workflow
- [ ] Test approval workflow
- [ ] Test file download
- [ ] Test page refresh (documents persist)

---

## Before & After Comparison

### Before (localStorage)
```javascript
// Documents stored only in browser
documents = [... ];
localStorage.setItem('adminDocuments', JSON.stringify(documents));
```

### After (Backend API)
```javascript
// Documents stored on server
fetch('http://localhost:5000/api/documents/upload', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log('Saved to server:', data);
})
```

---

## Production Deployment

When deploying to production:

1. **Change API URL**
```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

2. **Use HTTPS**
```javascript
fetch('https://your-domain.com/api/documents')
```

3. **Add Authentication Headers**
```javascript
fetch(url, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
```

4. **Enable API Security**
- Add API key validation
- Rate limiting
- CORS restrictions
- Input validation

---

## Performance Tips

1. **Cache Documents Locally**
```javascript
let cachedDocuments = null;
let cacheTime = null;

function getDocuments() {
  if (cachedDocuments && Date.now() - cacheTime < 5000) {
    return Promise.resolve(cachedDocuments);
  }
  return fetch(`${API_BASE_URL}/documents`)
    .then(r => r.json())
    .then(data => {
      cachedDocuments = data;
      cacheTime = Date.now();
      return data;
    });
}
```

2. **Debounce Search**
```javascript
let searchTimeout;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    displayDocuments();
  }, 300);
}
```

3. **Pagination**
```javascript
// Get documents with pagination
fetch(`${API_BASE_URL}/documents?page=1&limit=20`)
```

---

## Summary

The backend server is ready to use. Update your frontend code to:

1. **Fetch** data from `/api/documents`
2. **Upload** files to `/api/documents/upload`
3. **Delete** via `/api/documents/:id`
4. **Approve** via `/api/documents/:id/approve`
5. **Download** from `/api/documents/:id/download`

All documents will be:
- ✅ Saved to disk in `/documents` folder
- ✅ Persistent across page refreshes
- ✅ Accessible from all devices
- ✅ Backed up with your project files

**Happy integrating!** 🚀
