#!/bin/bash

# Toggle Video Preloader On/Off
# Usage: ./tools/toggle-video-preloader.sh [enable|disable]

ACTION=${1:-status}
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

case $ACTION in
  enable)
    echo "🎬 Enabling video preloader..."
    find "$PROJECT_ROOT/pages" -name "*.html" -exec sed -i '' 's|<!-- <script src="../src/js/video-preloader.js"></script> -->|<script src="../src/js/video-preloader.js"></script>|g' {} \;
    echo "✅ Video preloader enabled in all HTML files"
    ;;
  disable)
    echo "⏸️ Disabling video preloader..."
    find "$PROJECT_ROOT/pages" -name "*.html" -exec sed -i '' 's|<script src="../src/js/video-preloader.js"></script>|<!-- <script src="../src/js/video-preloader.js"></script> -->|g' {} \;
    echo "✅ Video preloader disabled in all HTML files"
    ;;
  status)
    echo "📊 Video Preloader Status:"
    ENABLED=$(grep -l 'src="../src/js/video-preloader.js"' "$PROJECT_ROOT/pages"/*.html | wc -l | xargs)
    DISABLED=$(grep -l '<!-- <script src="../src/js/video-preloader.js"' "$PROJECT_ROOT/pages"/*.html | wc -l | xargs)
    echo "   Enabled in: $ENABLED files"
    echo "   Disabled in: $DISABLED files"
    if [ "$ENABLED" -gt 0 ]; then
      echo "   Status: 🟢 ENABLED"
    else
      echo "   Status: 🔴 DISABLED"
    fi
    ;;
  *)
    echo "Usage: $0 [enable|disable|status]"
    echo "  enable  - Enable video preloader in all HTML files"
    echo "  disable - Disable video preloader in all HTML files"
    echo "  status  - Show current status"
    exit 1
    ;;
esac
