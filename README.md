# Waypoint Media Website - Organized Structure

## 📁 Directory Structure

```
waypoint_media_site/
├── pages/                 # HTML pages
│   ├── index.html        # Main homepage
│   ├── commercial.html   # Commercial portfolio
│   ├── real-estate.html  # Real estate portfolio
│   ├── gallery.html      # Photo gallery
│   ├── drone.html        # Drone portfolio
│   ├── contact.html      # Contact page
│   ├── terms.html        # Terms of service
│   └── resume.html       # Resume page
├── src/                   # Source code
│   ├── js/               # JavaScript modules
│   │   ├── video-preloader.js    # Advanced video preloading system
│   │   ├── video-manager.js      # Video management utilities
│   │   ├── commercial.js         # Commercial page functionality
│   │   └── global-video-config.js # Page-aware video configuration
│   └── css/              # Stylesheets
│       └── styles.css    # Main stylesheet
├── assets/               # Static assets
│   ├── waypoint/         # Media files (videos, images)
│   ├── favicon.ico       # Favicon
│   ├── logo.svg          # Company logo
│   └── *.png             # Various icons
├── config/               # Configuration files
│   ├── commercial.json   # Commercial portfolio config
│   └── photos.json       # Photo gallery config
├── tools/                # Development tools
│   ├── Makefile         # Build and dev commands
│   ├── cors_server.py   # CORS-enabled dev server
│   └── manage_photos.py # Photo management script
├── docs/                 # Documentation
│   ├── README.md         # This file
│   ├── DEPLOYMENT.md     # Deployment instructions
│   └── *.md             # Other documentation
└── index.html           # Root redirect to pages/index.html
```

## 🚀 Getting Started

### Development Server

```bash
# Start CORS-enabled server (recommended for video preloading)
make -f tools/Makefile serve-cors

# Or start standard HTTP server
make -f tools/Makefile serve

# Stop all servers
make -f tools/Makefile stop
```

### Access URLs

- **Main Site**: http://localhost:8080/pages/
- **Direct Access**: http://localhost:8080 (auto-redirects)
- **Real Estate**: http://localhost:8080/pages/real-estate.html
- **Commercial**: http://localhost:8080/pages/commercial.html

## 🎬 Video Preloading System

The site features an advanced video preloading system:

### Key Features

- **Page-Aware Prioritization**: Current page videos get priority 100-99, others 30-50
- **Cross-Page State Persistence**: Downloads continue across page navigation
- **Duplicate Prevention**: Prevents multiple downloads of same video
- **Enhanced Cache Detection**: Multi-source cache checking
- **Modal Video Support**: High priority for user-opened videos

### Debug Commands

```javascript
// In browser console:
debugVideoPreloader(); // Show detailed status
checkVideoDuplicates(); // Check for duplicate entries
clearPreloaderState(); // Clear all cached state
```

## 📝 Content Management

### Adding Photos/Videos

```bash
make -f tools/Makefile publish FILES=folder/ TYPE=real-estate TITLE='Project Title'
```

### Publishing Changes

```bash
make -f tools/Makefile deploy
```

## 🔧 Configuration

### Video Configuration

Edit `src/js/global-video-config.js` to configure page-specific video priorities.

### Portfolio Configuration

- Commercial: `config/commercial.json`
- Photos: `config/photos.json`

## 📱 Features

- **Responsive Design**: Mobile-first approach
- **Performance Optimized**: Advanced preloading and caching
- **SEO Friendly**: Proper meta tags and structure
- **Accessibility**: ARIA labels and semantic HTML
- **Cross-Platform**: Works on all modern browsers

## 🛠️ Development

### File Organization Benefits

- **Separation of Concerns**: HTML, CSS, JS in dedicated directories
- **Easy Maintenance**: Clear file organization
- **Build Process**: Structured for future build optimization
- **Version Control**: Better diff tracking with organized structure

### Adding New Pages

1. Create HTML file in `pages/`
2. Update navigation links in existing pages
3. Add any new JS/CSS to `src/` directories
4. Update `global-video-config.js` if videos are used

## � Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development setup and workflow
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment instructions and GitHub Pages setup
- **[REAL_ESTATE_PHOTOS.md](docs/REAL_ESTATE_PHOTOS.md)** - Photo management and organization
- **[COMMERCIAL_CONFIG.md](docs/COMMERCIAL_CONFIG.md)** - Commercial portfolio configuration
- **[HONEYBOOK-INTEGRATION.md](docs/HONEYBOOK-INTEGRATION.md)** - HoneyBook integration guide
- **[CLEAN-URLS.md](docs/CLEAN-URLS.md)** - Clean URL implementation details
- **[QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md)** - Quick commands and shortcuts
- **[WEBSITE-UPDATES-SUMMARY.md](docs/WEBSITE-UPDATES-SUMMARY.md)** - Recent updates and changes

## �🚀 Deployment

The restructure maintains compatibility with GitHub Pages. The root `index.html` redirects to `pages/index.html` automatically.

### Build Commands

```bash
# Full deployment
make -f tools/Makefile deploy

# Development testing
make -f tools/Makefile serve-cors
```

---

_This organized structure provides better maintainability, clearer separation of concerns, and easier development workflow while maintaining all existing functionality._
