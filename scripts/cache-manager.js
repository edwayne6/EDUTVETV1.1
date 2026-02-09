/**
 * Cache Manager - Handles all client-side caching with TTL
 * Reduces server load by caching frequently accessed data
 */

const CacheManager = (() => {
  const CACHE_PREFIX = 'edutvet_cache_';
  const CACHE_TTL = 'edutvet_ttl_';
  const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  const FOREVER_TTL = 24 * 60 * 60 * 1000; // 24 hours for static data

  /**
   * Save data to cache with Time-To-Live
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  const set = (key, data, ttl = DEFAULT_TTL) => {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
      localStorage.setItem(CACHE_TTL + key, Date.now() + ttl);
    } catch (e) {
      console.warn('Cache write failed:', e.message);
    }
  };

  /**
   * Get data from cache if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  const get = (key) => {
    try {
      const ttl = localStorage.getItem(CACHE_TTL + key);
      if (!ttl || Date.now() > parseInt(ttl)) {
        remove(key); // Clean up expired cache
        return null;
      }
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('Cache read failed:', e.message);
      return null;
    }
  };

  /**
   * Remove cache entry
   * @param {string} key - Cache key
   */
  const remove = (key) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
      localStorage.removeItem(CACHE_TTL + key);
    } catch (e) {
      console.warn('Cache removal failed:', e.message);
    }
  };

  /**
   * Clear all cached data
   */
  const clear = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TTL)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clear failed:', e.message);
    }
  };

  /**
   * Fetch data with automatic caching
   * @param {string} url - API endpoint URL
   * @param {object} options - Fetch options
   * @param {number} ttl - Cache TTL in milliseconds
   * @returns {Promise<any>} - Fetched data
   */
  const fetchWithCache = async (url, options = {}, ttl = DEFAULT_TTL) => {
    const cacheKey = url + JSON.stringify(options);
    
    // Check cache first
    const cached = get(cacheKey);
    if (cached) {
      console.log('Cache HIT:', url);
      return Promise.resolve(cached);
    }

    console.log('Cache MISS:', url);
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      set(cacheKey, data, ttl);
      return data;
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  };

  /**
   * Cache specific data types with preset TTLs
   */
  const cacheStrategies = {
    // Documents cache - updates every 10 minutes
    documents: (data) => set('documents', data, 10 * 60 * 1000),
    getDocuments: () => get('documents'),
    
    // Department info - updates daily (static data)
    departments: (data) => set('departments', data, FOREVER_TTL),
    getDepartments: () => get('departments'),
    
    // Search results - updates every 3 minutes (frequent searches)
    searchResults: (query, data) => set('search_' + query, data, 3 * 60 * 1000),
    getSearchResults: (query) => get('search_' + query),
    
    // User preferences - updates every session
    userPreferences: (data) => set('user_prefs', data, 8 * 60 * 60 * 1000),
    getUserPreferences: () => get('user_prefs'),
    
    // Analytics data - updates every 30 minutes
    analytics: (data) => set('analytics', data, 30 * 60 * 1000),
    getAnalytics: () => get('analytics')
  };

  /**
   * Get cache stats for debugging
   */
  const getStats = () => {
    const stats = {
      totalKeys: 0,
      cacheSize: 0,
      entries: []
    };
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          const ttl = localStorage.getItem(CACHE_TTL + key);
          const expiresIn = ttl ? Math.max(0, parseInt(ttl) - Date.now()) : 0;
          stats.totalKeys++;
          stats.cacheSize += localStorage.getItem(key).length;
          stats.entries.push({
            key: key.replace(CACHE_PREFIX, ''),
            expiresIn: Math.round(expiresIn / 1000) + 's'
          });
        }
      });
    } catch (e) {
      console.warn('Stats failed:', e.message);
    }
    
    return stats;
  };

  return {
    set,
    get,
    remove,
    clear,
    fetchWithCache,
    ...cacheStrategies,
    getStats
  };
})();

// Make available globally
if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
}
