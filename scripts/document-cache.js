/**
 * Document Caching Module
 * Implements efficient caching for document data to reduce server load
 */

const DocumentCache = {
  /**
   * Load documents with caching - checks cache first, then fetches from server
   * Reduces server load significantly for frequently accessed document lists
   */
  async loadDocumentsCached(forceRefresh = false) {
    try {
      // Check if user wants to force refresh
      if (forceRefresh) {
        CacheManager.remove('documents');
      }

      // Try to get from cache first
      let documents = CacheManager.getDocuments();
      
      if (documents) {
        console.log('📦 Loaded documents from cache');
        return documents;
      }

      console.log('🔄 Fetching documents from server...');
      
      // Fetch from server if not in cache
      documents = await fetch('/api/documents/published')
        .then(r => r.json())
        .catch(() => []);

      // Cache the result for 10 minutes
      if (documents.length > 0) {
        CacheManager.documents(documents);
        console.log('✅ Documents cached for 10 minutes');
      }

      return documents;
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  },

  /**
   * Load departments data with caching
   * Static data that rarely changes - cached for 24 hours
   */
  async loadDepartmentsCached(forceRefresh = false) {
    try {
      if (forceRefresh) {
        CacheManager.remove('departments');
      }

      let departments = CacheManager.getDepartments();
      
      if (departments) {
        console.log('📦 Loaded departments from cache');
        return departments;
      }

      // Static departments list (no server call needed)
      const departments_list = [
        'Agriculture & Environmental',
        'Applied Sciences',
        'Automotive & Mechanical',
        'Building & Civil Eng',
        'Business & Entrepreneurship',
        'Business Studies',
        'Computing & ICT',
        'Cosmetology',
        'Electrical & Electronics',
        'Fashion & Apparel Design',
        'Health & Applied Sciences',
        'Liberal Studies',
        'Tourism & Hospitality'
      ];

      CacheManager.departments(departments_list);
      return departments_list;
    } catch (error) {
      console.error('Error loading departments:', error);
      return [];
    }
  },

  /**
   * Search documents with caching
   * Caches search results for 3 minutes to avoid repeated server calls
   */
  async searchDocumentsCached(query) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // Check if search results are cached
      let results = CacheManager.getSearchResults(query);
      if (results) {
        console.log('📦 Loaded search results from cache');
        return results;
      }

      console.log('🔄 Searching server for:', query);

      // Fetch from server
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      results = await response.json();

      // Cache for 3 minutes
      if (results.length > 0) {
        CacheManager.searchResults(query, results);
        console.log('✅ Search results cached');
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  /**
   * Clear all document caches manually
   * Useful when admin uploads new documents
   */
  clearCache() {
    CacheManager.remove('documents');
    CacheManager.remove('departments');
    console.log('🗑️  Document cache cleared');
  },

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    const stats = CacheManager.getStats();
    console.table(stats);
    return stats;
  },

  /**
   * Enable auto-refresh of documents
   * Periodically refresh documents in background to keep cache fresh
   */
  enableAutoRefresh(intervalMinutes = 10) {
    setInterval(() => {
      this.loadDocumentsCached(true);
      console.log('🔄 Auto-refreshed document cache');
    }, intervalMinutes * 60 * 1000);
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.DocumentCache = DocumentCache;
}
