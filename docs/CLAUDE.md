# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Waypoint Media Site is a professional aerial cinematography and drone content creation portfolio website. It uses a pages/ directory structure with Apache .htaccess for clean URLs (waypointmediapro.com/real-estate instead of .html). Photos and videos are hosted on S3/CloudFront CDN.

## Development Commands

### Local Development

```bash
# Standard local development server
make serve              # Starts server at http://localhost:8000

# CORS-enabled server (for video preloading features)
make serve-cors         # Starts server at http://localhost:8080 with clean URLs

# Stop all development servers
make stop
```

### Content Publishing

```bash
# Publish photos/videos to portfolios (currently GitHub releases - needs S3 update)
make publish FILES=folder/ TYPE=real-estate TITLE='Project Title'

# Available TYPE options: real-estate, commercial, campground, general
# Optional: DESCRIPTION='...' NOAI=true PREVIEW=true

# Deploy website changes
make deploy             # Commits and pushes to GitHub Pages
```

### Python Tools Setup

```bash
# Initial environment setup
./setup.sh              # Installs dependencies, creates .env file

# Photo management
python3 manage_photos.py         # Scan and organize photos
python3 release_photos.py --help # Upload photos (GitHub releases - needs S3 version)
```

## Architecture

### URL Structure

- Uses `pages/` directory with Apache .htaccess rewriting
- Clean URLs: `waypointmediapro.com/real-estate` (no .html)
- Root redirects to pages/ directory
- DO NOT delete pages/ folder - it's essential for clean URLs

### CDN & Storage

- **Photos/Videos**: S3 bucket with CloudFront CDN (`https://d1fp8ti9bzsng5.cloudfront.net`)
- **Configuration**: Local JSON files in `/config/` directory
- **Frontend**: JavaScript builds CloudFront URLs from photo filenames

### Key Components

#### Photo Management System

- `release_photos.py`: Currently uses GitHub releases (NEEDS S3 UPDATE)
- `manage_photos.py`: Local photo organization
- AI-powered room classification with OpenAI Vision API
- Automatic image downsampling and optimization

#### Content Management

- JSON-based configuration in `/config/` directory
- `photos.json`: Contains metadata and filenames for S3 photos
- Dynamic photo galleries loaded via JavaScript

## Development Patterns

### Photo Publishing Workflow (Current - GitHub)

1. Place photos in temporary folder
2. Run `make publish` with appropriate parameters
3. Script handles AI classification, resizing, and upload
4. Updates JSON configuration files
5. Deploy changes with `make deploy`

### Photo Publishing Workflow (Needed - S3)

1. Same as above, but upload to S3 instead of GitHub releases
2. Update CloudFront URLs in configuration
3. Ensure photos are accessible via CloudFront CDN

## Environment Variables

- `OPENAI_API_KEY`: Required for AI photo classification
- Store in `.env` file (gitignored)

## Common Tasks

### Add New Real Estate Shoot (Current)

```bash
make publish FILES=photos_folder/ TYPE=real-estate TITLE='Property Name' --ai-classify
```

### Add New Real Estate Shoot (Needed - S3)

Need to create S3-enabled version of upload script

### Local Development with Video Features

Use `make serve-cors` instead of `make serve` for full video functionality

### Preview Photo Changes

```bash
python3 release_photos.py --shoot name --photos folder/ --preview-names
```

## TODO: S3 Integration

The website frontend uses S3/CloudFront but the upload scripts still use GitHub releases. Need to:

1. Create S3-enabled version of `release_photos.py`
2. Update Makefile to use S3 upload script
3. Ensure CloudFront invalidation after uploads
