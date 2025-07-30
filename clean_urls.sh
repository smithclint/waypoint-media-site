#!/bin/bash
# Update all HTML files to use clean URLs (without .html extension)

cd /Users/clintsmith/Dropbox/Clint/docs/development/waypoint_media_site/pages

echo "🔗 Converting to clean URLs..."

# Update navigation links to use clean URLs
sed -i '' 's|href="index\.html"|href="./"|g' *.html
sed -i '' 's|href="commercial\.html"|href="commercial"|g' *.html
sed -i '' 's|href="real-estate\.html"|href="real-estate"|g' *.html
sed -i '' 's|href="gallery\.html"|href="gallery"|g' *.html
sed -i '' 's|href="drone\.html"|href="drone"|g' *.html
sed -i '' 's|href="contact\.html"|href="contact"|g' *.html
sed -i '' 's|href="terms\.html"|href="terms"|g' *.html
sed -i '' 's|href="resume\.html"|href="resume"|g' *.html

# Update any direct page references in content
sed -i '' 's|commercial\.html|commercial|g' *.html
sed -i '' 's|real-estate\.html|real-estate|g' *.html
sed -i '' 's|gallery\.html|gallery|g' *.html
sed -i '' 's|drone\.html|drone|g' *.html
sed -i '' 's|contact\.html|contact|g' *.html
sed -i '' 's|terms\.html|terms|g' *.html
sed -i '' 's|resume\.html|resume|g' *.html

echo "✅ Updated all HTML files to use clean URLs"
echo "📝 URLs will now appear as:"
echo "   - /commercial (instead of /commercial.html)"
echo "   - /real-estate (instead of /real-estate.html)"
echo "   - /contact (instead of /contact.html)"
echo "   - etc."
