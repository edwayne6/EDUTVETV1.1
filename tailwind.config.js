module.exports = {
  content: [
    // Template files
    './index.html',
    './admin.html',
    './documents.html',
    './upload.html',
    './cookie-policy.html',
    './privacy-policy.html',
    './terms-of-service.html',
    
    // Department pages
    './departments/**/*.html',
    
    // EJS templates
    './views/**/*.ejs',
    
    // Admin panel
    './admin-panel/**/*.html',
    
    // Slider content
    './sliders/**/*.html',
    
    // JavaScript files that might contain class names
    './scripts/**/*.js',
    './admin-panel/**/*.js',
    
    // API/Server files (if using inline class generation)
    './utils/**/*.js',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      animation: {
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.8s ease-out forwards',
        'header': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  variants: {
    extend: {
      display: ['group-hover'],
      opacity: ['group-hover'],
      transform: ['group-hover', 'hover', 'focus'],
    },
  },
  plugins: [],
  // Whitelist specific patterns if dynamic classes are used
  safelist: [
    // Patterns for dynamically generated classes
    {
      pattern: /^bg-(blue|green|red|purple|gray|yellow|pink|orange)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    {
      pattern: /^text-(blue|green|red|purple|gray|yellow|pink|orange)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    {
      pattern: /^border-(blue|green|red|purple|gray|yellow|pink|orange)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // Specific classes that might be added dynamically
    'animate-on-scroll',
    'badge',
    'document-card',
    'filter-btn',
    'pin-input',
    'pin-container',
    'dashboard-container',
    'departments-sidebar',
    'main-content-wrapper',
    'tab-content',
    'tab-btn',
    'panel',
    'hidden',
    'show',
  ],
};