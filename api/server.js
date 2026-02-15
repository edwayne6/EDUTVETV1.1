const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Enable CORS - allow localhost and standard ports
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from localhost or without origin (same-origin)
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      // In production, you might want to restrict this
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(helmet());

// Global rate limiter (basic)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Cache control middleware for different asset types
app.use((req, res, next) => {
  const path = req.path;
  
  // Static assets - cache for 1 year (they have content hashes)
  if (/\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|eot|ttf)$/i.test(path)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // HTML pages - cache for 1 hour (content may change)
  else if (/\.html$/i.test(path)) {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // API responses - cache for 5 minutes
  else if (path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300');
  }
  // Default - no cache
  else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple request logger to help diagnose 4xx/5xx issues
app.use((req, res, next) => {
  console.log(`[http] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files from parent directory (CSS, JS, HTML, etc.)
const parentDir = path.join(__dirname, '..');
app.use(express.static(parentDir, {
  // Cache static assets for 1 hour
  maxAge: '1h',
  // Don't log every static file request
  dotfiles: 'deny'
}));

// Ensure documents folder exists (store uploads at workspace root `documents/`)
const documentsFolder = path.join(__dirname, '..', 'documents');
if (!fs.existsSync(documentsFolder)) {
  fs.mkdirSync(documentsFolder, { recursive: true });
  console.log(`✓ Created documents folder at: ${documentsFolder}`);
} else {
  console.log(`✓ Documents folder found at: ${documentsFolder}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsFolder);
  },
  filename: (req, file, cb) => {
    // Use original filename to preserve the document name
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory document storage (can be replaced with a database)
let documents = [
  { 
    id: 1, 
    documentCode: 'EDU-AGR-001',
    title: 'Crop Protection Guide', 
    department: 'Agriculture', 
    level: 'Level 5', 
    docType: 'Notes', 
    status: 'published', 
    date: '2025-01-20', 
    description: 'Comprehensive guide on crop protection',
    fileName: null,
    submittedBy: 'System'
  },
  { 
    id: 2, 
    documentCode: 'EDU-BUS-001',
    title: 'Business Plans', 
    department: 'Business', 
    level: 'Level 6', 
    docType: 'Curriculum', 
    status: 'published', 
    date: '2025-01-18', 
    description: 'Guide to creating business plans',
    fileName: null,
    submittedBy: 'System'
  },
  { 
    id: 3, 
    documentCode: 'EDU-ICT-001',
    title: 'Python Basics', 
    department: 'ICT', 
    level: 'Level 4', 
    docType: 'Notes', 
    status: 'published', 
    date: '2025-01-22', 
    description: 'Introduction to Python programming',
    fileName: null,
    submittedBy: 'System'
  }
];

let nextDocId = 4;

// Function to generate unique document code
function generateDocumentCode() {
  // Format: EDU-YYYY-XXXXXX where YYYY is year and XXXXXX is random alphanumeric
  const year = new Date().getFullYear().toString().slice(2); // Last 2 digits of year
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EDU-${year}-${randomPart}`;
}

// Initialize documents
function initializeDocuments() {
  console.log(`✓ Total documents loaded: ${documents.length}`);
}

// Execute initialization
initializeDocuments();

// ============================================
// DOCUMENT ENDPOINTS
// ============================================

// Get all documents
app.get("/api/documents", (req, res) => {
  try {
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving documents", error: error.message });
  }
});

// Get published documents only
app.get("/api/documents/published", (req, res) => {
  try {
    const published = documents.filter(doc => doc.status === 'published');
    res.json(published);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving published documents", error: error.message });
  }
});

// Get single document
app.get("/api/documents/:id", (req, res) => {
  try {
    const doc = documents.find(d => d.id === parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving document", error: error.message });
  }
});

// Get document by code (for easy retrieval)
app.get("/api/documents/code/:code", (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const doc = documents.find(d => d.documentCode === code);
    if (!doc) {
      return res.status(404).json({ message: "Document not found with code: " + code });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving document by code", error: error.message });
  }
});

// Download document by code (for easy retrieval)
app.get("/api/documents/code/:code/download", (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const doc = documents.find(d => d.documentCode === code);
    if (!doc || !doc.fileName) {
      return res.status(404).json({ message: "Document or file not found with code: " + code });
    }

    const filePath = path.join(documentsFolder, doc.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, doc.title + path.extname(doc.fileName));
  } catch (error) {
    res.status(500).json({ message: "Error downloading document by code", error: error.message });
  }
});

// Upload document
app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    const { title, description, department, level, docType, submittedBy } = req.body;

    // Basic sanitation and trimming
    const cleanTitle = (title || '').toString().trim().slice(0, 300);
    const cleanDesc = (description || '').toString().trim().slice(0, 5000);

    // Validation
    if (!cleanTitle || !department || !docType) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.log('Could not delete file after validation error');
        }
      }
      return res.status(400).json({ message: "Missing required fields: title, department, docType", success: false });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided", success: false });
    }

    // Validate file extension and MIME type
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.pptx'];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) { }
      return res.status(400).json({ message: `Invalid file type. Allowed: PDF, DOCX, PPTX`, success: false });
    }

    const newDocument = {
      id: nextDocId++,
      documentCode: generateDocumentCode(), // Add unique document code
      title: cleanTitle,
      description: cleanDesc,
      department,
      level: level || 'N/A',
      docType,
      status: 'published', // Admin uploads are directly published
      date: new Date().toISOString().split('T')[0],
      fileName: req.file.filename,
      submittedBy: submittedBy || 'Admin'
    };

    documents.push(newDocument);
    console.log('Document uploaded:',  newDocument.documentCode);
    
    //Ensure we're sending valid JSON
    return res.status(201).json({ 
      message: "Document uploaded and published successfully!",
      document: newDocument,
      success: true
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.log('Could not delete file after error');
      }
    }
    
    // Ensure we're sending valid JSON error response
    return res.status(500).json({ 
      message: "Error uploading document: " + (error.message || 'Unknown error'),
      error: error.message,
      success: false
    });
  }
});

// Create document (without file)
app.post("/api/documents", (req, res) => {
  try {
    const { title, description, department, level, docType, status, submittedBy } = req.body;

    if (!title || !department || !docType) {
      return res.status(400).json({ message: "Missing required fields: title, department, docType" });
    }

    const newDocument = {
      id: nextDocId++,
      documentCode: generateDocumentCode(), // Add unique document code
      title,
      description: description || '',
      department,
      level: level || 'N/A',
      docType,
      status: status || 'draft',
      date: new Date().toISOString().split('T')[0],
      fileName: null,
      submittedBy: submittedBy || 'System'
    };

    documents.push(newDocument);
    res.status(201).json({ 
      message: "Document created successfully.",
      document: newDocument 
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating document", error: error.message });
  }
});

// Update document
app.put("/api/documents/:id", (req, res) => {
  try {
    const doc = documents.find(d => d.id === parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const { title, description, department, level, docType, status } = req.body;
    
    if (title) doc.title = title;
    if (description !== undefined) doc.description = description;
    if (department) doc.department = department;
    if (level) doc.level = level;
    if (docType) doc.docType = docType;
    if (status) doc.status = status;

    res.json({ message: "Document updated successfully", document: doc });
  } catch (error) {
    res.status(500).json({ message: "Error updating document", error: error.message });
  }
});

// Approve document
app.post("/api/documents/:id/approve", (req, res) => {
  try {
    const doc = documents.find(d => d.id === parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    doc.status = 'published';
    res.json({ message: "Document approved and published", document: doc });
  } catch (error) {
    res.status(500).json({ message: "Error approving document", error: error.message });
  }
});

// Reject document
app.post("/api/documents/:id/reject", (req, res) => {
  try {
    const index = documents.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: "Document not found" });
    }

    const deletedDoc = documents[index];
    // Delete file if exists
    if (deletedDoc.fileName) {
      const filePath = path.join(documentsFolder, deletedDoc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    documents.splice(index, 1);
    res.json({ message: "Document rejected and deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting document", error: error.message });
  }
});

// Delete document
app.delete("/api/documents/:id", (req, res) => {
  try {
    const index = documents.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: "Document not found" });
    }

    const deletedDoc = documents[index];
    // Delete file if exists
    if (deletedDoc.fileName) {
      const filePath = path.join(documentsFolder, deletedDoc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    documents.splice(index, 1);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error: error.message });
  }
});

// Download document file
app.get("/api/documents/:id/download", (req, res) => {
  try {
    const doc = documents.find(d => d.id === parseInt(req.params.id));
    if (!doc || !doc.fileName) {
      return res.status(404).json({ message: "Document or file not found" });
    }
    let filePath;
    if (doc.filePath) {
      // filePath is relative to documentsFolder
      filePath = path.join(documentsFolder, doc.filePath);
    } else {
      // fallback for legacy/manual uploads
      filePath = path.join(documentsFolder, doc.fileName);
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }
    res.download(filePath, doc.title + path.extname(doc.fileName));
  } catch (error) {
    res.status(500).json({ message: "Error downloading document", error: error.message });
  }
});

// OPTIONS handler for CORS preflight requests
app.options('/api/documents', (req, res) => {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  res.status(200).json({ message: 'OK' });
});

app.options('/api/documents/upload', (req, res) => {
  res.setHeader('Allow', 'POST, OPTIONS');
  res.status(200).json({ message: 'OK' });
});

app.options('/api/documents/:id', (req, res) => {
  res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
  res.status(200).json({ message: 'OK' });
});

// Serve static files from documents folder (make uploaded files accessible)
app.use('/documents', express.static(documentsFolder, {
  maxAge: '1h',
  dotfiles: 'deny'
}));




// ============================================
// VISITOR TRACKING
// ============================================

// Stats file path
const statsFile = path.join(__dirname, 'stats.json');

// Initialize stats file if it doesn't exist
function initializeStats() {
  if (!fs.existsSync(statsFile)) {
    fs.writeFileSync(statsFile, JSON.stringify({ 
      totalVisits: 0, 
      uniqueVisitors: new Set(),
      visits: []
    }, null, 2));
  }
}

// Read stats from file
function readStats() {
  try {
    const data = fs.readFileSync(statsFile, 'utf8');
    const stats = JSON.parse(data);
    // Convert uniqueVisitors array back to Set
    stats.uniqueVisitors = new Set(stats.uniqueVisitors);
    return stats;
  } catch (error) {
    console.error('Error reading stats:', error);
    return { totalVisits: 0, uniqueVisitors: new Set(), visits: [] };
  }
}

// Write stats to file
function writeStats(stats) {
  try {
    // Convert Set to array before writing
    const dataToWrite = {
      totalVisits: stats.totalVisits,
      uniqueVisitors: Array.from(stats.uniqueVisitors),
      visits: stats.visits
    };
    fs.writeFileSync(statsFile, JSON.stringify(dataToWrite, null, 2));
  } catch (error) {
    console.error('Error writing stats:', error);
  }
}

// Record a visit
app.post("/api/visit", (req, res) => {
  try {
    const { visitorId, page } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    initializeStats();
    const stats = readStats();

    // Increment total visits
    stats.totalVisits = (stats.totalVisits || 0) + 1;

    // Track unique visitors
    if (!stats.uniqueVisitors.has(visitorId)) {
      stats.uniqueVisitors.add(visitorId);
    }

    // Record visit details
    stats.visits.push({
      visitorId,
      page: page || '/',
      timestamp: new Date().toISOString()
    });

    writeStats(stats);

    res.json({
      message: "Visit recorded",
      totalVisits: stats.totalVisits,
      uniqueVisitors: stats.uniqueVisitors.size
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ message: "Error recording visit", error: error.message });
  }
});

// Get visitor stats
app.get("/api/stats", (req, res) => {
  try {
    initializeStats();
    const stats = readStats();

    res.json({
      totalVisits: stats.totalVisits || 0,
      uniqueVisitors: stats.uniqueVisitors.size || 0,
      recentVisits: (stats.visits || []).slice(-10).reverse()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server is running",
    documentsCount: documents.length,
    documentsFolder: documentsFolder
  });
});

// 404 Error Handler
app.use((req, res) => {
  console.log(`[404] Unmatched: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Server Error',
    status: 500
  });
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Listening at http://localhost:${PORT}`);
  console.log(`========================================`);
  console.log('Ready for document management.');
});
