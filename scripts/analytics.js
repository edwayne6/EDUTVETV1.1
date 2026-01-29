/**
 * Client-side visitor tracking
 * Generates/retrieves a unique visitor ID and records a visit on page load
 */

(function() {
  // Only track if we have access to window/localStorage
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  // Generate or retrieve a unique visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('edutvet_visitor_id');
    if (!visitorId) {
      // Generate a new unique ID (timestamp + random)
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('edutvet_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Record a visit
  function recordVisit() {
    const visitorId = getVisitorId();
    const page = window.location.pathname || '/';
    
    // Send visit to server (don't block on error)
    try {
      // Try localhost (for development)
      fetch('http://localhost:5000/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId: visitorId,
          page: page
        })
      }).catch(error => {
        // Silently fail if server is not available
        console.log('Analytics server unavailable, visit not recorded');
      });
    } catch (error) {
      console.log('Error recording visit:', error);
    }
  }

  // Record visit on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', recordVisit);
  } else {
    recordVisit();
  }
})();
