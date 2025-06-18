// This script verifies that external resources are loaded properly
// It provides fallback mechanisms when possible
(function() {
  window.addEventListener('error', function(event) {
    // Check if the error is related to script loading
    if (event.target && (event.target.nodeName === 'SCRIPT' || event.target.nodeName === 'LINK')) {
      console.error('Failed to load resource:', event.target.src || event.target.href);
      
      // Log the error for troubleshooting
      const errorElement = document.createElement('div');
      errorElement.style.display = 'none';
      errorElement.setAttribute('data-resource-error', event.target.src || event.target.href);
      document.body.appendChild(errorElement);
    }
  }, true);
  
  // Check for React loading
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.error('React or ReactDOM failed to load. Attempting to use fallback CDN.');
        
        // Try loading React from alternate CDN
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@19.1.0/umd/react.production.min.js';
        reactScript.crossOrigin = 'anonymous';
        document.head.appendChild(reactScript);
        
        const reactDomScript = document.createElement('script');
        reactDomScript.src = 'https://unpkg.com/react-dom@19.1.0/umd/react-dom.production.min.js';
        reactDomScript.crossOrigin = 'anonymous';
        document.head.appendChild(reactDomScript);
      }
    }, 2000); // Check after 2 seconds
  });
})();
