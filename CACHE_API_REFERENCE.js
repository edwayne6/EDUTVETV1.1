/**
 * QUICK REFERENCE - Cache Manager API
 * Copy and paste examples for common caching operations
 */

// ============================================
// BASIC CACHING OPERATIONS
// ============================================

// Save data to cache (5 minute default)
CacheManager.set('my-key', { data: 'value' });

// Save with custom duration (in milliseconds)
CacheManager.set('my-key', data, 60000); // 1 minute

// Get data from cache (returns null if expired)
const data = CacheManager.get('my-key');

// Remove specific cache entry
CacheManager.remove('my-key');

// Clear all cached data
CacheManager.clear();


// ============================================
// DOCUMENT CACHING (Most Common)
// ============================================

// Load documents with automatic refresh from cache
const docs = await DocumentCache.loadDocumentsCached();

// Force server refresh (bypass cache)
const freshDocs = await DocumentCache.loadDocumentsCached(true);

// Load departments
const depts = await DocumentCache.loadDepartmentsCached();

// Search with caching
const results = await DocumentCache.searchDocumentsCached('agriculture');

// Clear document cache (use after admin uploads)
DocumentCache.clearCache();

// Get cache statistics
const stats = DocumentCache.getCacheStats();
// Returns: { totalKeys, cacheSize, entries: [...] }

// Enable auto-refresh (updates cache every N minutes)
DocumentCache.enableAutoRefresh(10); // 10 minutes


// ============================================
// FETCH WITH AUTOMATIC CACHING
// ============================================

// Fetch and cache result automatically
const response = await CacheManager.fetchWithCache(
  '/api/documents',
  { method: 'GET' },
  300000  // Cache for 5 minutes
);


// ============================================
// STRATEGY: PRE-CONFIGURED CACHE TYPES
// ============================================

// Documents (10 min cache)
CacheManager.documents(documentArray);
const docs = CacheManager.getDocuments();

// Departments (24 hour cache)
CacheManager.departments(deptArray);
const depts = CacheManager.getDepartments();

// Search Results (3 min cache)
CacheManager.searchResults('query', resultsArray);
const results = CacheManager.getSearchResults('query');

// User Preferences (8 hour cache)
CacheManager.userPreferences(prefsObject);
const prefs = CacheManager.getUserPreferences();

// Analytics (30 min cache)
CacheManager.analytics(analyticsData);
const analytics = CacheManager.getAnalytics();


// ============================================
// REAL-WORLD EXAMPLES
// ============================================

// Example 1: Load documents on page load
async function initializePage() {
  const documents = await DocumentCache.loadDocumentsCached();
  renderDocuments(documents);
}

// Example 2: Handle search with caching
async function searchHandler(event) {
  const query = event.target.value;
  const results = await DocumentCache.searchDocumentsCached(query);
  displayResults(results);
}

// Example 3: Admin form submission
async function handleUpload(formData) {
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });
  
  if (response.ok) {
    DocumentCache.clearCache(); // Invalidate cache
    showSuccess('Document uploaded!');
  }
}

// Example 4: Monitor cache health
function showCacheStats() {
  const stats = DocumentCache.getCacheStats();
  console.log('Cache Status:', stats);
  
  if (stats.totalKeys > 20) {
    console.warn('Cache is getting large, consider clearing');
  }
}

// Example 5: Logout - clear sensitive data
function logout() {
  CacheManager.clear(); // Clear all cached data
  SessionStorage.removeItem('user');
  window.location.href = '/';
}


// ============================================
// DEBUGGING & MONITORING
// ============================================

// View all cache entries
CacheManager.getStats();

// Clear specific cache entry
CacheManager.remove('documents');

// Empty entire cache
CacheManager.clear();

// Check if service worker is active
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    console.log('✅ Service Worker active - offline support enabled');
  });
}

// View Service Worker cache in console
// Chrome DevTools: F12 → Application → Cache Storage → edutvet-v1


// ============================================
// COMMON PATTERNS
// ============================================

// Pattern 1: Load with fallback
const docs = CacheManager.getDocuments() || 
             await DocumentCache.loadDocumentsCached();

// Pattern 2: Conditional refresh
async function loadOrRefresh(shouldRefresh = false) {
  return await DocumentCache.loadDocumentsCached(shouldRefresh);
}

// Pattern 3: Cache → Serve → Update
async function smartLoad() {
  // Return cached data immediately
  const cached = CacheManager.getDocuments();
  if (cached) {
    displayDocs(cached);
  }
  
  // Update in background
  const fresh = await DocumentCache.loadDocumentsCached(true);
  updateDocs(fresh); // Re-render if different
}

// Pattern 4: Error handling with cache fallback
async function safeLoad() {
  try {
    return await DocumentCache.loadDocumentsCached();
  } catch (error) {
    console.error('Load failed, using cache:', error);
    return CacheManager.getDocuments() || [];
  }
}


// ============================================
// CONSOLE TIPS
// ============================================

// Run in browser console to test:

// 1. Get cache info
DocumentCache.getCacheStats();

// 2. Load documents
await DocumentCache.loadDocumentsCached();

// 3. Clear cache
CacheManager.clear();

// 4. Check if Service Worker is registered
navigator.serviceWorker.getRegistrations();

// 5. Unregister Service Worker (if needed)
navigator.serviceWorker.getRegistration('/sw.js').then(reg => reg.unregister());


// ============================================
// CONFIGURATION
// ============================================

// Default TTL (milliseconds) - edit in cache-manager.js
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// Long TTL for static data
const FOREVER_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Custom durations for data types
const DURATIONS = {
  documents: 10 * 60 * 1000,        // 10 minutes
  departments: 24 * 60 * 60 * 1000, // 24 hours
  search: 3 * 60 * 1000,             // 3 minutes
  preferences: 8 * 60 * 60 * 1000,   // 8 hours
  analytics: 30 * 60 * 1000          // 30 minutes
};


// ============================================
// TROUBLESHOOTING
// ============================================

/* 
  Issue: Data is stale
  Solution: Last entry has 'expiresIn' field - wait for TTL or clear manually
  Command: CacheManager.remove('key-name')

  Issue: Service Worker not registered
  Solution: Check browser console for errors, ensure sw.js exists at root
  Command: navigator.serviceWorker.getRegistrations()

  Issue: Cache using too much storage
  Solution: Clear cache or adjust TTLs - typical usage is 100-500KB
  Command: CacheManager.clear()

  Issue: Changes not visible after deployment
  Solution: Hard refresh (Ctrl+Shift+R) or clear Service Worker cache
  Chrome DevTools → Application → Service Workers → Unregister
*/
