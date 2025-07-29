# Real Estate Portfolio Documentation

## 🏠 Overview

This real estate portfolio system provides a complete solution for showcasing property photography with AI-powered organization, smooth navigation, and automated deployment via GitHub releases.

## 🚀 Quick Start

### 1. Local Development

```bash
# Start local server for testing
make serve

# Visit: http://localhost:8000/real-estate.html
# Press Ctrl+C to stop server
```

### 2. Upload New Photos

```bash
# Create photos directory and add images
mkdir -p photos_to_upload
# Copy your photos to photos_to_upload/

# Upload with AI classification
make upload-photos
```

### 3. Deploy Changes

```bash
# Deploy all changes to live site
make deploy
```

## 📋 Available Commands

Run `make help` to see all available commands:

- **`make serve`** - Start local development server
- **`make upload-photos`** - Upload and classify new photos
- **`make deploy`** - Deploy changes to GitHub
- **`make status`** - Check git repository status
- **`make clean`** - Clean temporary files
- **`make stats`** - Show portfolio statistics

## 🔧 Setup Requirements

### Dependencies

```bash
# Install Python dependencies
make install-deps

# Or manually:
pip3 install openai pillow requests python-dotenv
```

### Environment Configuration

Create a `.env` file in the project root:

```bash
# OpenAI API key for photo classification
OPENAI_API_KEY=your_openai_api_key_here
```

### Directory Structure

```
waypoint_media_site/
├── real-estate.html          # Main portfolio page
├── real-estate.js            # Portfolio JavaScript
├── styles.css               # Styling
├── photos.json              # Portfolio metadata
├── release_photos.py        # Photo upload script
├── Makefile                 # Automation commands
├── .env                     # Environment variables (create this)
├── photos_to_upload/        # Drop new photos here
└── assets/
    └── waypoint/
        ├── banner.png
        └── logo.png
```

## 📸 Photo Management Workflow

### Adding New Photos

1. **Create Upload Directory**

   ```bash
   mkdir -p photos_to_upload
   ```

2. **Add Photos**
   - Copy your property photos to `photos_to_upload/`
   - Supported formats: JPG, JPEG, PNG, WebP
   - Original resolution (will be optimized automatically)

3. **Configure Shoot Details**
   Edit the `release_photos.py` script to set:
   - `SHOOT_NAME` - Name for the property shoot
   - `SHOOT_DESCRIPTION` - Description text
   - `SHOOT_CATEGORY` - Category (residential, commercial, luxury-homes, waterfront)

4. **Upload and Process**
   ```bash
   make upload-photos
   ```

This will:

- ✅ Downsample images to 1920x1080 @ 85% quality
- 🤖 Use AI to classify room types (exterior, living, kitchen, etc.)
- 📛 Generate intelligent filenames with room classifications
- 🏷️ Create MD5-prefixed unique identifiers
- 📤 Upload to GitHub releases
- 📋 Update `photos.json` with metadata

### Photo Classification System

The AI automatically classifies photos into 21 room categories with priority ordering:

1. **Exterior** (highest priority)
2. **Living** areas
3. **Kitchen**
4. **Dining** room
5. **Family** room
6. **Great** room
7. **Den**
8. **Office**
9. **Study**
10. **Library**
11. **Master** bedroom
12. **Bedroom**
13. **Bathroom**
14. **Garage**
15. **Closet**
16. **Laundry**
17. **Utility**
18. **Pantry**
19. **Storage**
20. **Attic**
21. **Basement** (lowest priority)

## 🎨 Portfolio Configuration

### photos.json Structure

```json
{
  "shoot-id": {
    "title": "Property Title",
    "description": "Property description",
    "category": "residential",
    "featured_photo_index": "filename-of-featured-photo.jpg",
    "release_tag": "github-release-tag",
    "shoot_prefix": "unique-prefix"
  }
}
```

### Featured Photo Selection

Set the featured photo by filename:

```json
"featured_photo_index": "sugar-mi-5dfef1-exterior-zillowphotoexterior6.jpg"
```

## 🖥️ User Interface Features

### Navigation System

- **Smooth Transitions** - No black flash between images
- **Arrow Navigation** - Click left/right arrows or use keyboard
- **Keyboard Controls** - Arrow keys for navigation, Escape to close
- **Consistent Positioning** - Arrows stay in place during transitions

### Responsive Design

- **Mobile Optimized** - Works on all device sizes
- **Touch Friendly** - Swipe gestures supported
- **Fast Loading** - Optimized images with lazy loading

### Image Organization

- **AI-Powered Sorting** - Exteriors first, utility rooms last
- **Category Filtering** - Filter by property type
- **Modal Gallery** - Full-screen image viewing

## 🚀 Deployment Process

### Automatic Deployment

```bash
make deploy
```

This will:

1. Check for changes
2. Stage all modifications
3. Create timestamped commit
4. Push to GitHub
5. Trigger live site update

### Manual Deployment

```bash
git add .
git commit -m "Update portfolio"
git push
```

## 🔍 Development & Testing

### Local Testing

```bash
# Start development server
make serve

# Test in browser
open http://localhost:8000/real-estate.html
```

### GitHub Integration

- Photos are hosted via GitHub Releases
- Automatic CDN distribution
- Version control for all assets
- Backup and rollback capability

## 🛠️ Troubleshooting

### Common Issues

**Photos not loading locally:**

- Make sure you're using `make serve` (HTTP server)
- Don't open HTML files directly in browser
- Check console for CORS errors

**AI classification not working:**

- Verify `.env` file contains valid OpenAI API key
- Check internet connection
- Ensure OpenAI SDK is installed

**Upload failures:**

- Check GitHub repository permissions
- Verify git configuration
- Ensure unique release tag names

**Navigation issues:**

- Clear browser cache
- Check JavaScript console for errors
- Verify all image URLs are accessible

### Debug Commands

```bash
# Check dependencies
make check-deps

# View portfolio statistics
make stats

# Check git status
make status

# Clean temporary files
make clean
```

## 📊 Performance Optimization

### Image Processing

- **Automatic Downsampling** - 1920x1080 maximum resolution
- **Quality Optimization** - 85% JPEG quality for web
- **Format Standardization** - Consistent image formats
- **Progressive Loading** - Lazy loading for faster page loads

### AI Cost Optimization

- **Downsampled Classification** - AI processes optimized images to save tokens
- **Batch Processing** - Efficient API usage
- **Intelligent Caching** - Avoid re-classifying existing photos

### Network Optimization

- **CDN Distribution** - GitHub releases provide global CDN
- **Compressed Assets** - Optimized file sizes
- **Efficient Loading** - Only load visible images initially

## 🔐 Security & Best Practices

### Environment Variables

- Keep `.env` file out of version control
- Use strong OpenAI API keys
- Rotate keys periodically

### Git Practices

- Regular commits with descriptive messages
- Feature branch development for major changes
- Backup before major updates

### Performance Monitoring

- Monitor image loading times
- Check mobile performance
- Validate accessibility compliance

## 📞 Support & Maintenance

### Regular Maintenance

- Update dependencies monthly
- Review API usage costs
- Archive old photo releases
- Update portfolio content regularly

### Backup Strategy

- Git repository provides full version history
- GitHub releases store all image assets
- Export `photos.json` regularly for metadata backup

---

## 🎯 Workflow Summary

**For New Properties:**

1. `mkdir photos_to_upload && cp photos/* photos_to_upload/`
2. Edit shoot details in `release_photos.py`
3. `make upload-photos`
4. `make deploy`

**For Updates:**

1. Make changes to HTML/CSS/JS
2. `make deploy`

**For Testing:**

1. `make serve`
2. Open http://localhost:8000/real-estate.html

That's it! Your real estate portfolio is ready to showcase your work professionally. 🏠✨
