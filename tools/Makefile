# Waypoint Media Content Publishing Makefile
# Author: Clint Smith
# Description: Unified automation for publishing photos and videos to portfolios
# Note: Run from project root directory

.PHONY: help serve serve-cors publish deploy stop

# Default target
help:
	@echo "🎬 Waypoint Media Publishing Commands"
	@echo "===================================="
	@echo ""
	@echo "Commands:"
	@echo "  make -f tools/Makefile serve       - Test website locally (standard HTTP server)"
	@echo "  make -f tools/Makefile serve-cors  - Test with CORS-enabled server (for video preloading)"
	@echo "  make -f tools/Makefile stop        - Stop all running development servers"
	@echo "  make -f tools/Makefile publish     - Publish photos/videos to portfolios"
	@echo "  make -f tools/Makefile deploy      - Deploy website updates to live site"
	@echo ""
	@echo "Usage:"
	@echo "  1. Put files in any folder"
	@echo "  2. Run: make -f tools/Makefile publish FILES=folder/ TYPE=real-estate TITLE='Project Title'"
	@echo "  3. Run: make -f tools/Makefile deploy"
	@echo ""
	@echo "Required Options:"
	@echo "  FILES=folder/      - Folder containing your photos/videos"
	@echo "  TYPE=category      - real-estate|commercial|campground|general"
	@echo "  TITLE='title'      - Display title for the project"
	@echo ""
	@echo "Optional:"
	@echo "  DESCRIPTION='...'  - Project description"
	@echo "  NOAI=true         - Skip AI classification for photos"
	@echo "  PREVIEW=true      - Preview only, don't upload"
	@echo ""
	@echo "Examples:"
	@echo "  make publish FILES=temp_videos/ TYPE=commercial TITLE='Furniture Store'"
	@echo "  make publish FILES=photos_folder/ TYPE=real-estate TITLE='Luxury Home'"
	@echo "  make publish FILES=campground_pics/ TYPE=campground TITLE='RV Resort'"

# Development server
serve:
	@echo "🚀 Starting local server at http://localhost:8000"
	@echo "🏠 Main Site: http://localhost:8000"
	@echo "🏘️  Real Estate: http://localhost:8000/real-estate.html"
	@echo "📞 Contact: http://localhost:8000/contact.html"
	@echo "Press Ctrl+C to stop"
	python3 -m http.server 8000

# CORS-enabled development server (needed for video preloading)
serve-cors:
	@echo "🚀 Starting CORS-enabled server at http://localhost:8080"
	@echo "🏠 Main Site: http://localhost:8080/pages/"
	@echo "🏘️  Real Estate: http://localhost:8080/pages/real-estate.html"
	@echo "📞 Contact: http://localhost:8080/pages/contact.html"
	@echo "📹 This server resolves video preloading CORS issues"
	@echo "Press Ctrl+C to stop"
	python3 tools/cors_server.py

# Stop development servers
stop:
	@echo "🛑 Stopping development servers..."
	@pkill -f cors_server.py || echo "No CORS server running"
	@pkill -f "python3 -m http.server" || echo "No HTTP server running"

# Deploy website
deploy:
	@echo "🚀 Deploying to GitHub..."
	git add .
	git commit -m "Update website - $(shell date '+%Y-%m-%d %H:%M')"
	git push
	@echo "✅ Done!"

# Unified publishing command
publish:
	@echo "🎬 Publishing content..."
	@if [ -z "$(FILES)" ]; then \
		echo "❌ Error: Please specify FILES folder"; \
		echo "Usage: make publish FILES=folder/ TYPE=real-estate TITLE='Project Title'"; \
		exit 1; \
	fi
	@if [ -z "$(TYPE)" ]; then \
		echo "❌ Error: Please specify TYPE"; \
		echo "Options: real-estate, commercial, campground, general"; \
		exit 1; \
	fi
	@if [ -z "$(TITLE)" ]; then \
		echo "❌ Error: Please specify TITLE"; \
		echo "Usage: make publish FILES=folder/ TYPE=real-estate TITLE='Project Title'"; \
		exit 1; \
	fi
	@if [ ! -d "$(FILES)" ]; then \
		echo "❌ Error: $(FILES) directory not found!"; \
		exit 1; \
	fi

	@echo "📁 Analyzing files in $(FILES)..."
	@PHOTO_COUNT=$$(find "$(FILES)" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l | tr -d ' '); \
	VIDEO_COUNT=$$(find "$(FILES)" -type f \( -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.webm" \) | wc -l | tr -d ' '); \
	TOTAL_COUNT=$$(($$PHOTO_COUNT + $$VIDEO_COUNT)); \
	if [ "$$TOTAL_COUNT" -eq 0 ]; then \
		echo "❌ No photos or videos found in $(FILES)"; \
		echo "Supported: .jpg, .jpeg, .png, .webp, .mp4, .mov, .avi, .mkv, .webm"; \
		exit 1; \
	fi; \
	echo "📸 Found $$PHOTO_COUNT photo(s) and 🎥 $$VIDEO_COUNT video(s)"; \

	@echo "🏷️  Publishing to $(TYPE) portfolio: $(TITLE)"; \
	if [ "$(TYPE)" = "real-estate" ]; then \
		SHOOT_NAME=$$(echo "$(TITLE)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$$//g'); \
		echo "🏠 Using real estate workflow with shoot name: $$SHOOT_NAME"; \
		CMD="python3 release_photos.py --shoot $$SHOOT_NAME --photos $(FILES)"; \
		if [ "$(NOAI)" != "true" ] && [ "$$PHOTO_COUNT" -gt 0 ]; then \
			CMD="$$CMD --ai-classify"; \
			echo "🤖 Using AI classification for photos..."; \
		else \
			echo "⚡ Skipping AI classification..."; \
		fi; \
		if [ "$(PREVIEW)" = "true" ]; then \
			CMD="$$CMD --preview-names --dry-run"; \
			echo "👀 Preview mode - no upload..."; \
		else \
			CMD="$$CMD --auto-upload"; \
			echo "📤 Will upload to GitHub..."; \
		fi; \
		CMD="$$CMD --title '$(TITLE)'"; \
		[ -n "$(DESCRIPTION)" ] && CMD="$$CMD --description '$(DESCRIPTION)'"; \
		CMD="$$CMD --category residential"; \
		echo "🚀 Running: $$CMD"; \
		eval $$CMD; \
	else \
		TAG_NAME=$$(echo "$(TYPE)-$(TITLE)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$$//g'); \
		echo "📦 Using general release workflow with tag: $$TAG_NAME"; \
		if [ "$(PREVIEW)" = "true" ]; then \
			echo "👀 Preview mode - would create release: $$TAG_NAME"; \
			find "$(FILES)" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.webm" \) -exec basename {} \; | sed "s/.*/https:\/\/github.com\/smithclint\/waypoint-media-site\/releases\/download\/$$TAG_NAME\/&/"; \
		else \
			gh release delete "$$TAG_NAME" --yes 2>/dev/null || echo "Creating new release..."; \
			gh release create "$$TAG_NAME" --title "$(TITLE)" --notes "$(TYPE) content: $(TITLE) - uploaded $(shell date '+%Y-%m-%d %H:%M')"; \
			find "$(FILES)" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.webm" \) -exec gh release upload "$$TAG_NAME" {} \;; \
			echo "✅ Files uploaded to release: $$TAG_NAME"; \
			echo "🔗 URLs:"; \
			find "$(FILES)" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.webm" \) -exec basename {} \; | sed "s/.*/https:\/\/github.com\/smithclint\/waypoint-media-site\/releases\/download\/$$TAG_NAME\/&/"; \
		fi; \
	fi
