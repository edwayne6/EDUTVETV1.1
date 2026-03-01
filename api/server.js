const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const db = require("./database");
const emailService = require("./email-service");
const recommendationEngine = require("./recommendation-engine");

dotenv.config();

const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// JWT Secret - use environment variable or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-this-in-production';

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

// Database is now used for document storage (see database.js)

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: "No token provided", authenticated: false });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token", authenticated: false });
    }
    req.user = user;
    next();
  });
}

// Backwards-compatible alias used in some route handlers
function authenticateToken(req, res, next) {
  return verifyToken(req, res, next);
}

// Function to generate unique document code
function generateDocumentCode() {
  // Format: EDU-YYYY-XXXXXX where YYYY is year and XXXXXX is random alphanumeric
  const year = new Date().getFullYear().toString().slice(2); // Last 2 digits of year
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EDU-${year}-${randomPart}`;
}

// Database initialization will be done on server startup

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Get user from database
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "User account is disabled" });
    }

    // Verify password
    const isValidPassword = await db.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      authenticated: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Check token validity
app.post("/api/auth/verify", verifyToken, (req, res) => {
  res.json({
    message: "Token is valid",
    authenticated: true,
    user: req.user
  });
});

// Get current user info
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
});

// Logout endpoint (client-side removes token)
app.post("/api/auth/logout", verifyToken, (req, res) => {
  res.json({ message: "Logged out successfully", authenticated: false });
});

// Change password
app.post("/api/auth/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Get user from database
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValidPassword = await db.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    await db.updateUserPassword(req.user.id, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
});

// ============================================
// DOCUMENT ENDPOINTS
// ============================================

// Get all documents
app.get("/api/documents", async (req, res) => {
  try {
    const documents = await db.getAllDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving documents", error: error.message });
  }
});

// Get published documents only
app.get("/api/documents/published", async (req, res) => {
  try {
    const published = await db.getPublishedDocuments();
    res.json(published);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving published documents", error: error.message });
  }
});

// Get single document
app.get("/api/documents/:id", async (req, res) => {
  try {
    const doc = await db.getDocumentById(parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Track view interaction if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        await recommendationEngine.trackInteraction(decoded.id, doc.id, 'view', { 
          source: 'details_page',
          department: doc.department,
          level: doc.level 
        });
      } catch (tokenError) {
        // Ignore token errors - don't fail the request
        console.log('Token verification failed for interaction tracking:', tokenError.message);
      }
    }
    
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving document", error: error.message });
  }
});

// Get document by code (for easy retrieval)
app.get("/api/documents/code/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const doc = await db.getDocumentByCode(code);
    if (!doc) {
      return res.status(404).json({ message: "Document not found with code: " + code });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving document by code", error: error.message });
  }
});

// Download document by code (for easy retrieval)
app.get("/api/documents/code/:code/download", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const doc = await db.getDocumentByCode(code);
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

// Upload document (requires authentication)
app.post("/api/documents/upload", verifyToken, upload.single('file'), async (req, res) => {
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
      documentCode: generateDocumentCode(),
      title: cleanTitle,
      description: cleanDesc,
      department,
      level: level || 'N/A',
      docType,
      status: 'published',
      date: new Date().toISOString().split('T')[0],
      fileName: req.file.filename,
      submittedBy: submittedBy || 'Admin'
    };

    const savedDoc = await db.createDocument(newDocument);
    console.log('Document uploaded:', savedDoc.documentCode);

    // Send email notification to admins
    try {
      await emailService.notifyDocumentUploaded(savedDoc);
    } catch (emailError) {
      console.error('Failed to send upload notification email:', emailError);
      // Don't fail the upload if email fails
    }
    
    return res.status(201).json({ 
      message: "Document uploaded and published successfully!",
      document: savedDoc,
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
    
    return res.status(500).json({ 
      message: "Error uploading document: " + (error.message || 'Unknown error'),
      error: error.message,
      success: false
    });
  }
});

// Create document (without file) - requires authentication
app.post("/api/documents", verifyToken, async (req, res) => {
  try {
    const { title, description, department, level, docType, status, submittedBy } = req.body;

    if (!title || !department || !docType) {
      return res.status(400).json({ message: "Missing required fields: title, department, docType" });
    }

    const newDocument = {
      documentCode: generateDocumentCode(),
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

    const savedDoc = await db.createDocument(newDocument);
    res.status(201).json({ 
      message: "Document created successfully.",
      document: savedDoc 
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating document", error: error.message });
  }
});

// Update document (requires authentication)
app.put("/api/documents/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.getDocumentById(parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const updatedDoc = await db.updateDocument(parseInt(req.params.id), req.body);
    res.json({ message: "Document updated successfully", document: updatedDoc });
  } catch (error) {
    res.status(500).json({ message: "Error updating document", error: error.message });
  }
});

// Approve document (requires authentication)
app.post("/api/documents/:id/approve", verifyToken, async (req, res) => {
  try {
    const doc = await db.getDocumentById(parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const updatedDoc = await db.updateDocument(parseInt(req.params.id), { status: 'published' });

    // Send email notification to the user who uploaded the document
    try {
      // Get user email from database (assuming we store user emails)
      const userEmail = await db.getUserEmailByUsername(doc.submittedBy);
      if (userEmail) {
        await emailService.notifyDocumentApproved(updatedDoc, userEmail);
      }
    } catch (emailError) {
      console.error('Failed to send approval notification email:', emailError);
      // Don't fail the approval if email fails
    }

    res.json({ message: "Document approved and published", document: updatedDoc });
  } catch (error) {
    res.status(500).json({ message: "Error approving document", error: error.message });
  }
});

// Reject document (requires authentication)
app.post("/api/documents/:id/reject", verifyToken, async (req, res) => {
  try {
    const deletedDoc = await db.getDocumentById(parseInt(req.params.id));
    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Send email notification to the user who uploaded the document before deleting
    try {
      const userEmail = await db.getUserEmailByUsername(deletedDoc.submittedBy);
      const feedback = req.body.feedback || req.body.reason || 'Please review and resubmit with the requested changes.';
      if (userEmail) {
        await emailService.notifyDocumentRejected(deletedDoc, userEmail, feedback);
      }
    } catch (emailError) {
      console.error('Failed to send rejection notification email:', emailError);
      // Don't fail the rejection if email fails
    }

    // Delete file if exists
    if (deletedDoc.fileName) {
      const filePath = path.join(documentsFolder, deletedDoc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.deleteDocument(parseInt(req.params.id));
    res.json({ message: "Document rejected and deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting document", error: error.message });
  }
});

// Delete document (requires authentication)
app.delete("/api/documents/:id", verifyToken, async (req, res) => {
  try {
    const deletedDoc = await db.getDocumentById(parseInt(req.params.id));
    if (!deletedDoc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file if exists
    if (deletedDoc.fileName) {
      const filePath = path.join(documentsFolder, deletedDoc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.deleteDocument(parseInt(req.params.id));
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error: error.message });
  }
});

// Download document file
app.get("/api/documents/:id/download", async (req, res) => {
  try {
    const doc = await db.getDocumentById(parseInt(req.params.id));
    if (!doc || !doc.fileName) {
      return res.status(404).json({ message: "Document or file not found" });
    }
    let filePath;
    if (doc.filePath) {
      filePath = path.join(documentsFolder, doc.filePath);
    } else {
      filePath = path.join(documentsFolder, doc.fileName);
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }
    
    // Track download interaction if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        await recommendationEngine.trackInteraction(decoded.id, doc.id, 'download', { 
          source: 'download_link',
          department: doc.department,
          level: doc.level,
          fileSize: doc.fileSize
        });
      } catch (tokenError) {
        // Ignore token errors - don't fail the request
        console.log('Token verification failed for interaction tracking:', tokenError.message);
      }
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

// Recommendation endpoints
app.get("/api/recommendations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationEngine.getRecommendations(userId, limit);
    
    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations"
    });
  }
});

app.post("/api/interactions", authenticateToken, async (req, res) => {
  try {
    const { documentId, interactionType, metadata } = req.body;
    const userId = req.user.id;
    
    if (!documentId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: "Document ID and interaction type are required"
      });
    }
    
    await recommendationEngine.trackInteraction(userId, documentId, interactionType, metadata);
    
    res.json({
      success: true,
      message: "Interaction tracked successfully"
    });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track interaction"
    });
  }
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

// Start server with database initialization
const PORT = process.env.PORT || 5000;

db.initializeDatabase().then(() => {
  return db.getDocumentCount();
}).then(async (count) => {
  console.log(`✓ Total documents in database: ${count}`);

  // Initialize email service
  const emailConnected = await emailService.verifyConnection();
  if (emailConnected) {
    console.log('✓ Email notifications enabled');
  } else {
    console.log('⚠ Email notifications disabled - check SMTP configuration');
  }

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Listening at http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log('Ready for document management.');
    console.log('SQLite database: edu-tvet.db');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
