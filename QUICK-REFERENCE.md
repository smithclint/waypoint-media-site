# 🏠 Real Estate Portfolio - Quick Reference

## Essential Commands

```bash
# Setup (run once)
./setup.sh                    # Initial setup
make install-deps             # Install dependencies

# Daily Development
make serve                    # Start local server → http://localhost:8000/real-estate.html
make deploy                   # Deploy changes to live site
make status                   # Check what's changed

# Photo Management (Simple)
make upload-photos            # Upload new photos with AI classification
make preview-photos           # Preview photo names without uploading

# Photo Management (Advanced)
make upload-photos-custom     # Show all available options
make photos-help              # Show release_photos.py help
make SHOOT=my-property upload-photos-run  # Custom upload

# Troubleshooting
make clean                    # Clean temporary files
make check-deps              # Verify dependencies
```

## File Structure

```
📁 waypoint_media_site/
├── 🌐 real-estate.html       # Main portfolio page
├── ⚙️ real-estate.js         # Portfolio functionality
├── 🎨 styles.css            # Styling
├── 📋 photos.json           # Portfolio metadata
├── 🤖 release_photos.py     # AI photo processor
├── 🔧 Makefile              # Automation commands
├── 📖 README-real-estate.md # Full documentation
├── 🔐 .env                  # API keys (create this)
└── 📸 photos_to_upload/     # Drop new photos here
```

## Workflow: Adding New Photos

### Simple Method (Recommended)

1. **Prepare photos:**

   ```bash
   cp /path/to/new/photos/* photos_to_upload/
   ```

2. **Upload & deploy:**
   ```bash
   make upload-photos    # AI processes and uploads
   make deploy          # Push to live site
   ```

### Advanced Method (Full Control)

1. **See all options:**

   ```bash
   make upload-photos-custom
   ```

2. **Custom upload examples:**

   ```bash
   # Basic custom upload
   make SHOOT=luxury-estate TITLE="Luxury Estate" upload-photos-run

   # Full options
   make SHOOT=beachfront-condo TITLE="Beachfront Condo" DESCRIPTION="Oceanfront luxury" CATEGORY=waterfront FEATURED=2 upload-photos-run

   # Preview only (no upload)
   make SHOOT=test-property DRY_RUN=true upload-photos-run
   ```

3. **Deploy:**
   ```bash
   make deploy
   ```

## AI Photo Classification

Photos are automatically sorted by room type:

- **High Priority:** Exterior → Living → Kitchen → Dining
- **Medium Priority:** Bedrooms → Bathrooms → Office spaces
- **Low Priority:** Utility → Storage → Closets

## Environment Setup

Create `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Local Testing

```bash
make serve
# Visit: http://localhost:8000/real-estate.html
# Press Ctrl+C to stop
```

## Troubleshooting

- **Photos not loading locally?** Use `make serve` (not file:// URLs)
- **AI not working?** Check `.env` file has valid OpenAI API key
- **Upload failing?** Verify git permissions and internet connection
- **Need help?** Run `make help` or check `README-real-estate.md`

---

💡 **Tip:** Run `make help` anytime to see all available commands!
