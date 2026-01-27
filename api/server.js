const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5000", "file://"],
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure documents folder exists
const documentsFolder = path.join(__dirname, '../documents');
if (!fs.existsSync(documentsFolder)) {
  fs.mkdirSync(documentsFolder, { recursive: true });
  console.log('Documents folder created at:', documentsFolder);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
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

// Upload document
app.post("/api/documents/upload", upload.single('file'), (req, res) => {
  try {
    const { title, description, department, level, docType, submittedBy } = req.body;

    // Validation
    if (!title || !department || !docType) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.log('Could not delete file after validation error');
        }
      }
      return res.status(400).json({ message: "Missing required fields: title, department, docType" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const newDocument = {
      id: nextDocId++,
      title,
      description: description || '',
      department,
      level: level || 'N/A',
      docType,
      status: 'published', // Admin uploads are directly published
      date: new Date().toISOString().split('T')[0],
      fileName: req.file.filename,
      submittedBy: submittedBy || 'Admin'
    };

    documents.push(newDocument);
    
    console.log('Document uploaded successfully:');
    console.log('- ID:', newDocument.id);
    console.log('- Title:', newDocument.title);
    console.log('- File:', newDocument.fileName);
    
    res.status(201).json({ 
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
    res.status(500).json({ 
      message: "Error uploading document", 
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

    const filePath = path.join(documentsFolder, doc.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, doc.title + path.extname(doc.fileName));
  } catch (error) {
    res.status(500).json({ message: "Error downloading document", error: error.message });
  }
});

// Serve static files from documents folder
app.use('/documents', express.static(documentsFolder));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server is running",
    documentsCount: documents.length,
    documentsFolder: documentsFolder
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`EduTVET API Server running on port ${PORT}`);
  console.log(`Documents stored in: ${documentsFolder}`);
  console.log(`========================================\n`);
});
