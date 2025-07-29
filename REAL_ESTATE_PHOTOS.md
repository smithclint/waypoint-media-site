# Real Estate Photo Management System

This system provides an easy way to manage and organize your real estate aerial photography portfolio.

## Directory Structure

```
assets/real-estate/
├── luxury-waterfront-estate/
│   ├── aerial-overview.jpg
│   ├── pool-entertainment.jpg
│   └── private-dock.jpg
├── modern-office-complex/
│   ├── building-overview.jpg
│   └── parking-access.jpg
└── suburban-family-home/
    ├── front-elevation.jpg
    └── backyard-space.jpg
```

## How It Works

### 1. Photo Storage Options

**Option A: Local Directory Structure (Recommended for development)**

- Create folders in `assets/real-estate/[shoot-name]/`
- Place your photos in each shoot folder
- Run the management script to update the website

**Option B: GitHub Releases (Recommended for production)**

- Upload photos as release assets like you did with videos
- Update the `photos.json` file with GitHub release URLs
- Photos load fast and don't bloat your repository

**Option C: AWS S3 (Enterprise option)**

- Upload photos to S3 bucket
- Update URLs in `photos.json` to point to S3
- Best for very large photo collections

### 2. Photo Management Script

The `manage_photos.py` script automates photo organization:

```bash
# Create sample directory structure
python3 manage_photos.py --create-sample

# Scan directories and update website
python3 manage_photos.py

# Just scan without updating files
python3 manage_photos.py --scan-only
```

### 3. Configuration File

The `photos.json` file controls how photos appear on your website:

```json
{
  "shoot-name": {
    "title": "Display Title",
    "description": "Shoot description",
    "category": "luxury-homes|commercial|residential|waterfront",
    "images": [
      {
        "url": "path/to/photo.jpg",
        "caption": "Photo description"
      }
    ]
  }
}
```

## Adding New Photos

### Method 1: Local Files

1. Create a new folder: `assets/real-estate/my-new-shoot/`
2. Add your photos to the folder
3. Run: `python3 manage_photos.py`
4. Edit `photos.json` to customize titles and categories
5. Commit and push changes

### Method 2: GitHub Releases

1. Create a new GitHub release
2. Upload photos as release assets
3. Copy the download URLs
4. Add a new shoot to `photos.json` with GitHub URLs
5. Commit and push changes

### Method 3: AWS S3

1. Upload photos to your S3 bucket
2. Get the public URLs
3. Add to `photos.json` with S3 URLs

## Categories

- **luxury-homes**: High-end residential properties
- **commercial**: Office buildings, retail, industrial
- **residential**: Standard family homes
- **waterfront**: Beach, lake, river properties

## Photo Specifications

- **Format**: JPG, PNG, or WebP
- **Resolution**: Minimum 1920x1080, recommended 4K
- **File Size**: Under 5MB per photo (will be lazy-loaded)
- **Aspect Ratio**: 4:3 or 16:9 work best

## Workflow Examples

### For a New Real Estate Shoot

1. **Organize photos locally:**

   ```bash
   mkdir assets/real-estate/luxury-home-miami-beach
   # Copy your photos to this folder
   python3 manage_photos.py
   ```

2. **Customize the shoot details:**
   Edit `photos.json` to add proper titles, descriptions, and categories

3. **Test locally:**
   Open `real-estate.html` in your browser to preview

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Added Miami Beach luxury home shoot"
   git push origin main
   ```

### For GitHub Release Hosting

1. **Create release with photos:**

   ```bash
   git tag photos-miami-beach-v1.0
   git push origin photos-miami-beach-v1.0
   # Upload photos via GitHub web interface
   ```

2. **Update configuration:**
   Edit `photos.json` with GitHub release URLs:
   ```json
   "url": "https://github.com/smithclint/waypoint-media-site/releases/download/photos-miami-beach-v1.0/photo1.jpg"
   ```

## Tips

- Use descriptive folder names (they become default shoot IDs)
- Keep photo file names descriptive for auto-generated captions
- Test on mobile devices - the gallery is fully responsive
- Use the filter system to organize by property type
- Optimize images before uploading to reduce load times

## Troubleshooting

- **Photos not showing:** Check file paths in `photos.json`
- **Slow loading:** Reduce image file sizes or use WebP format
- **Mobile issues:** Test responsive breakpoints at different screen sizes
- **Categories not working:** Verify category names match the filter buttons
