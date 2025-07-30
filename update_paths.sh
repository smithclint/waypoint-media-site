#!/bin/bash
# Update all HTML files to use the new organized directory structure

cd /Users/clintsmith/Dropbox/Clint/docs/development/waypoint_media_site/pages

# Update CSS references
sed -i '' 's|href="styles\.css"|href="../src/css/styles.css"|g' *.html

# Update JavaScript references
sed -i '' 's|src="video-preloader\.js"|src="../src/js/video-preloader.js"|g' *.html
sed -i '' 's|src="video-manager\.js"|src="../src/js/video-manager.js"|g' *.html
sed -i '' 's|src="commercial\.js"|src="../src/js/commercial.js"|g' *.html
sed -i '' 's|src="global-video-config\.js"|src="../src/js/global-video-config.js"|g' *.html

# Update asset references (favicons, images)
sed -i '' 's|href="favicon-16x16\.png"|href="../assets/favicon-16x16.png"|g' *.html
sed -i '' 's|href="favicon-32x32\.png"|href="../assets/favicon-32x32.png"|g' *.html
sed -i '' 's|href="apple-touch-icon\.png"|href="../assets/apple-touch-icon.png"|g' *.html
sed -i '' 's|href="/favicon\.ico"|href="../assets/favicon.ico"|g' *.html
sed -i '' 's|href="site\.webmanifest"|href="../assets/site.webmanifest"|g' *.html

# Update logo and image references
sed -i '' 's|src="logo\.svg"|src="../logo.svg"|g' *.html
sed -i '' 's|src="headshot\.jpg"|src="../headshot.jpg"|g' *.html

# Update inter-page links to include pages/ directory
sed -i '' 's|href="commercial\.html"|href="commercial.html"|g' *.html
sed -i '' 's|href="gallery\.html"|href="gallery.html"|g' *.html
sed -i '' 's|href="real-estate\.html"|href="real-estate.html"|g' *.html
sed -i '' 's|href="drone\.html"|href="drone.html"|g' *.html
sed -i '' 's|href="contact\.html"|href="contact.html"|g' *.html
sed -i '' 's|href="terms\.html"|href="terms.html"|g' *.html
sed -i '' 's|href="resume\.html"|href="resume.html"|g' *.html
sed -i '' 's|href="index\.html"|href="index.html"|g' *.html

echo "Updated all HTML files with new directory structure paths"
