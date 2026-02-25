const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'edu-tvet.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✓ Connected to SQLite database at:', dbPath);
  }
});

// Initialize database schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users/admin table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          isActive INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
      });
      // Create user interactions table for recommendation engine
      db.run(`
        CREATE TABLE IF NOT EXISTS user_interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          document_id INTEGER NOT NULL,
          interaction_type TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          UNIQUE(user_id, document_id, interaction_type)
        )
      `, (err) => {
        if (err) console.error('Error creating user_interactions table:', err.message);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          documentCode TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          department TEXT NOT NULL,
          level TEXT DEFAULT 'N/A',
          docType TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
          date TEXT NOT NULL,
          description TEXT,
          fileName TEXT,
          submittedBy TEXT DEFAULT 'System',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else {
          // Check if admin user exists, if not create default
          db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (!err && row.count === 0) {
              insertDefaultAdmin();
            }
            // Insert default documents if empty
            db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
              if (!err && row.count === 0) {
                insertDefaultDocuments();
              }
              resolve();
            });
          });
        }
      });
    });
  });
}

// Insert default documents
function insertDefaultDocuments() {
  const defaultDocs = [
    {
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

  defaultDocs.forEach(doc => {
    db.run(
      `INSERT INTO documents (documentCode, title, department, level, docType, status, date, description, fileName, submittedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc.documentCode, doc.title, doc.department, doc.level, doc.docType, doc.status, doc.date, doc.description, doc.fileName, doc.submittedBy],
      (err) => {
        if (err) console.error('Error inserting default document:', err.message);
      }
    );
  });
}

// Insert default admin user
function insertDefaultAdmin() {
  const defaultPassword = 'admin123'; // CHANGE THIS!
  const saltRounds = 10;
  
  bcrypt.hash(defaultPassword, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err.message);
      return;
    }
    
    db.run(
      `INSERT INTO users (username, email, passwordHash, role, isActive)
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@edu-tvet.com', hash, 'admin', 1],
      (err) => {
        if (err) console.error('Error inserting default admin:', err.message);
        else console.log('✓ Default admin created (username: admin, password: admin123)');
      }
    );
  });
}

// Database operations (Promise-based)

function getAllDocuments() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM documents ORDER BY date DESC', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getPublishedDocuments() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM documents WHERE status = 'published' ORDER BY date DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getDocumentById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getDocumentByCode(code) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE documentCode = ?', [code.toUpperCase()], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createDocument(documentData) {
  return new Promise((resolve, reject) => {
    const { documentCode, title, description, department, level, docType, status, date, fileName, submittedBy } = documentData;
    
    db.run(
      `INSERT INTO documents (documentCode, title, description, department, level, docType, status, date, fileName, submittedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [documentCode, title, description, department, level, docType, status, date, fileName, submittedBy],
      function(err) {
        if (err) reject(err);
        else {
          getDocumentById(this.lastID).then(resolve).catch(reject);
        }
      }
    );
  });
}

function updateDocument(id, updateData) {
  return new Promise((resolve, reject) => {
    const { title, description, department, level, docType, status } = updateData;
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (level !== undefined) {
      updates.push('level = ?');
      values.push(level);
    }
    if (docType !== undefined) {
      updates.push('docType = ?');
      values.push(docType);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length === 1) {
      reject(new Error('No fields to update'));
      return;
    }

    const query = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) reject(err);
      else {
        getDocumentById(id).then(resolve).catch(reject);
      }
    });
  });
}

function deleteDocument(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM documents WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getDocumentCount() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else {
        console.log('✓ Database connection closed');
        resolve();
      }
    });
  });
}

// Get user email by username
function getUserEmailByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT email FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.email : null);
      }
    });
  });
}

// Get user by username
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Get user by ID
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Verify password
function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Create user
function createUser(username, email, passwordHash, role = 'user') {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, role, new Date().toISOString()],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email, role });
        }
      }
    );
  });
}

// Update user password
function updateUserPassword(userId, newPasswordHash) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET passwordHash = ? WHERE id = ?',
      [newPasswordHash, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });
}

// Get all users
function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, username, email, role, createdAt FROM users ORDER BY username', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  getAllDocuments,
  getPublishedDocuments,
  getDocumentById,
  getDocumentByCode,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentCount,
  closeDatabase,
  // User functions
  getUserByUsername,
  getUserById,
  verifyPassword,
  createUser,
  updateUserPassword,
  getAllUsers,
  getUserEmailByUsername
};

