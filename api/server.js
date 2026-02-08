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

// Enable CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5000"],
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

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure documents folder exists
const documentsFolder = path.join(__dirname, '../documents');
if (!fs.existsSync(documentsFolder)) {
  fs.mkdirSync(documentsFolder, { recursive: true });
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
app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
  try {
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
      return res.status(400).json({ message: "Missing required fields: title, department, docType" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Moderate content before saving
    try {
      const mod = await moderateText(cleanTitle + "\n\n" + cleanDesc);
      if (mod.flagged) {
        // delete uploaded file to avoid storing disallowed content
        try { fs.unlinkSync(req.file.path); } catch (e) { }
        return res.status(403).json({ message: 'Content flagged by moderation and rejected', details: mod.categories || mod });
      }
    } catch (e) {
      console.log('Moderation check failed, continuing upload (fail-open):', e.message || e);
    }

    const newDocument = {
      id: nextDocId++,
      title: cleanTitle,
      description: cleanDesc,
      department,
      level: level || 'N/A',
      docType,
      status: 'published', // Admin uploads are directly published
      date: new Date().toISOString().split('T')[0],
      fileName: req.file.filename,
      submittedBy: submittedBy || 'Admin',
      fullText: '' // Will be populated below
    };

    // Extract full text from the uploaded file
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    try {
      const extractedText = await extractText(filePath, mimeType);
      newDocument.fullText = extractedText;

      // Moderate the extracted text as well
      if (extractedText) {
        const mod = await moderateText(extractedText);
        if (mod.flagged) {
          try { fs.unlinkSync(filePath); } catch (e) { }
          return res.status(403).json({ message: 'Extracted content flagged by moderation and rejected', details: mod.categories || mod });
        }
      }
    } catch (e) {
      console.log('Text extraction failed, proceeding without full text:', e.message || e);
    }

    documents.push(newDocument);
    
    // Generate embedding for the new document (best-effort)
    try {
      const textForEmbedding = (newDocument.fullText ? `${newDocument.title}\n\n${newDocument.description}\n\n${newDocument.fullText}` : `${newDocument.title}\n\n${newDocument.description}`).slice(0, 2000);
      const emb = await createEmbedding(textForEmbedding);
      embeddingsIndex[newDocument.id] = emb;
    } catch (e) {
      console.log('Could not create embedding for new document:', e.message || e);
    }
    
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

// --- Text Extraction Helpers ---
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');

async function extractText(filePath, mimeType) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    if (mimeType === 'application/pdf' || ext === '.pdf') {
      // Try pdf-parse first for text-based PDFs
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text.trim();

      // If text is too short (likely scanned), use OCR
      if (text.length < 100) {
        console.log('PDF appears scanned, running OCR...');
        const worker = await createWorker('eng');
        const { data: { text: ocrText } } = await worker.recognize(filePath);
        await worker.terminate();
        text = ocrText.trim();
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
      // Extract from Word doc
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value.trim();
    } else {
      throw new Error('Unsupported file type for text extraction');
    }

    // Sanitize: limit length, remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim().slice(0, 10000); // Limit to 10k chars
    return text;
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return ''; // Fallback to empty string
  }
}

// --- AI Integration (basic summarize + embeddings + search) ---
const fetch = require('node-fetch');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. AI endpoints will fail without a key.');
}

// In-memory embeddings index: { docId: [vector] }
const embeddingsIndex = {};

// AI moderation helper
async function moderateText(text) {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');
  try {
    const resp = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text })
    });
    const data = await resp.json();
    // Response structure: results[0].categories / flagged boolean
    const result = data && data.results && data.results[0] ? data.results[0] : null;
    if (!result) return { flagged: false };
    return { flagged: !!result.flagged, categories: result.categories || {}, category_scores: result.category_scores || {} };
  } catch (e) {
    console.error('Moderation error:', e.message || e);
    // Fail-open: do not block on moderation service errors, but log
    return { flagged: false, error: e.message };
  }
}

// Per-route AI rate limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit per IP for AI endpoints
  message: { error: 'Too many AI requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);

async function createEmbedding(text) {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  const data = await resp.json();
  if (!data || !data.data || !data.data[0] || !data.data[0].embedding) throw new Error('Embedding failed');
  return data.data[0].embedding;
}

async function openaiChat(prompt, max_tokens = 200) {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens
    })
  });
  const data = await resp.json();
  return data;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Build initial embeddings for existing documents (non-blocking)
(async function buildInitialEmbeddings() {
  try {
    for (const doc of documents) {
      const text = (doc.fullText ? `${doc.title}\n\n${doc.description || ''}\n\n${doc.fullText}` : `${doc.title}\n\n${doc.description || ''}`).slice(0, 2000);
      try {
        const emb = await createEmbedding(text);
        embeddingsIndex[doc.id] = emb;
      } catch (e) {
        // ignore embedding errors during startup
        console.log('Embedding error for doc', doc.id, e.message);
      }
    }
  } catch (e) {
    console.error('Error building initial embeddings:', e.message);
  }
})();

// Summarize endpoint
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { text, docId } = req.body || {};
    let inputText = text;
    if (!inputText && docId) {
      const doc = documents.find(d => d.id === parseInt(docId));
      if (doc) inputText = doc.fullText ? `${doc.title}\n\n${doc.description || ''}\n\n${doc.fullText}` : `${doc.title}\n\n${doc.description || ''}`;
    }
    if (!inputText) return res.status(400).json({ error: 'Missing text or docId' });

    // Moderate before sending to AI
    try {
      const mod = await moderateText(inputText.slice(0, 5000));
      if (mod.flagged) return res.status(403).json({ error: 'Content flagged by moderation' , details: mod.categories});
    } catch (e) {
      console.log('Moderation service error (summarize):', e.message || e);
    }

    const prompt = `Summarize the following document in 2-3 concise sentences:\n\n${inputText}`;
    const aiResp = await openaiChat(prompt, 200);
    const summary = aiResp?.choices?.[0]?.message?.content || aiResp?.choices?.[0]?.text || '';
    res.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error.message || error);
    res.status(500).json({ error: error.message || 'AI summarize failed' });
  }
});

// Embedding endpoint (optional)
app.post('/api/ai/embed', async (req, res) => {
  try {
    const { text, docId } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const emb = await createEmbedding(text);
    // optionally store if docId provided
    if (docId) embeddingsIndex[docId] = emb;
    res.json({ embedding: emb });
  } catch (error) {
    console.error('Embed error:', error.message || error);
    res.status(500).json({ error: error.message || 'Embedding failed' });
  }
});

// Semantic search endpoint
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, topK } = req.body || {};
    if (!query) return res.status(400).json({ error: 'Missing query' });
    const qEmb = await createEmbedding(query.slice(0, 2000));
    const scores = [];
    for (const doc of documents) {
      const emb = embeddingsIndex[doc.id];
      if (!emb) continue;
      const score = cosineSim(qEmb, emb);
      scores.push({ id: doc.id, score });
    }
    scores.sort((a, b) => b.score - a.score);
    const k = Math.max(1, Math.min(10, topK || 5));
    const top = scores.slice(0, k).map(s => {
      const d = documents.find(x => x.id === s.id);
      return { document: d, score: s.score };
    });
    res.json({ results: top });
  } catch (error) {
    console.error('Search error:', error.message || error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

// AI Assistant chat proxy endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Missing message' });

    // Moderate user message before sending
    try {
      const mod = await moderateText(message.slice(0, 4000));
      if (mod.flagged) return res.status(403).json({ error: 'Message flagged by moderation', details: mod.categories });
    } catch (e) {
      console.log('Moderation error (chat):', e.message || e);
    }

    // Optionally include short context for better responses
    const prompt = context ? `Context:\n${context}\n\nUser: ${message}` : `User: ${message}`;
    const aiResp = await openaiChat(prompt, 800);
    const reply = aiResp?.choices?.[0]?.message?.content || aiResp?.choices?.[0]?.text || '';
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message || error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});


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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  // Server started
