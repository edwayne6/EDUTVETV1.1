// EduTVET Visitor & Activity Tracker
// Tracks page views, time on site, downloads, and document additions
// Stores data in localStorage and optionally sends to backend API

(function() {
  const TRACKER_KEY = 'edutvet_analytics';
  const SESSION_KEY = 'edutvet_session';
  const API_ENDPOINT = 'http://localhost:5000/api/analytics';
  
  // Initialize or retrieve session
  let sessionData = getSessionData();
  
  if (!sessionData) {
    sessionData = {
      id: generateSessionId(),
      startTime: Date.now(),
      pageViews: [{ page: window.location.pathname, timestamp: Date.now() }],
      duration: 0,
      activities: [],
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    };
    saveSessionData(sessionData);
  }
  
  // Track page views
  function trackPageView() {
    if (!sessionData.pageViews.some(pv => pv.page === window.location.pathname)) {
      sessionData.pageViews.push({
        page: window.location.pathname,
        timestamp: Date.now()
      });
      saveSessionData(sessionData);
    }
  }
  
  // Track activity (download, form submission, etc)
  window.trackActivity = function(activityType, details = {}) {
    const activity = {
      type: activityType,
      timestamp: Date.now(),
      page: window.location.pathname,
      details: details
    };
    sessionData.activities.push(activity);
    saveSessionData(sessionData);
    
    // Also save to global analytics
    const analytics = getAnalytics();
    analytics.activities.push({
      ...activity,
      sessionId: sessionData.id
    });
    saveAnalytics(analytics);
  };
  
  // Track document/course addition
  window.trackDocumentAdded = function(docData) {
    const timestamp = Date.now();
    const docRecord = {
      id: docData.id || Date.now(),
      title: docData.title,
      department: docData.department,
      level: docData.level || 'N/A',
      status: docData.status || 'pending',
      addedAt: timestamp,
      addedBy: docData.addedBy || 'system',
      type: docData.type || 'document'
    };
    
    const analytics = getAnalytics();
    if (!analytics.documentsAdded) analytics.documentsAdded = [];
    analytics.documentsAdded.push(docRecord);
    saveAnalytics(analytics);
    
    trackActivity('document_added', {
      docId: docRecord.id,
      title: docRecord.title,
      department: docRecord.department
    });
  };
  
  // Track downloads
  window.trackDownload = function(fileName, docId = null) {
    trackActivity('download', {
      fileName: fileName,
      docId: docId
    });
  };
  
  // Update session duration periodically
  setInterval(() => {
    sessionData.duration = Date.now() - sessionData.startTime;
    saveSessionData(sessionData);
  }, 5000); // every 5 seconds
  
  // Before unload, save final session data to analytics
  window.addEventListener('beforeunload', () => {
    sessionData.duration = Date.now() - sessionData.startTime;
    const analytics = getAnalytics();
    analytics.sessions.push({
      ...sessionData,
      endTime: Date.now()
    });
    saveAnalytics(analytics);
    
    // Attempt to send to API (best-effort, won't block unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT + '/session', JSON.stringify({
        ...sessionData,
        endTime: Date.now()
      }));
    }
  });
  
  // Track clicks on download links
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.matches('a[download]') || e.target.matches('a[href*="download"]'))) {
      trackDownload(e.target.href, e.target.dataset.docId);
    }
  });
  
  // Helper functions
  function getSessionData() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }
  
  function saveSessionData(data) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save session data');
    }
  }
  
  function getAnalytics() {
    try {
      const data = localStorage.getItem(TRACKER_KEY);
      return data ? JSON.parse(data) : initAnalytics();
    } catch (e) {
      return initAnalytics();
    }
  }
  
  function initAnalytics() {
    return {
      sessions: [],
      activities: [],
      documentsAdded: [],
      startDate: Date.now()
    };
  }
  
  function saveAnalytics(data) {
    try {
      localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save analytics');
    }
  }
  
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Initial page view tracking
  trackPageView();
  
  // Expose analytics getter for admin panel
  window.getAnalyticsData = function() {
    return getAnalytics();
  };
  
  window.getClearAnalytics = function() {
    localStorage.removeItem(TRACKER_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };
})();
