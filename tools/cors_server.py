#!/usr/bin/env python3
"""
Simple HTTP server with CORS headers enabled for local development
Includes clean URL support (no .html extensions needed)
"""
import http.server
import os
import socketserver
from urllib.parse import urlparse


class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Handle clean URLs by checking for .html files
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Root redirect to pages/
        if path == "/":
            self.send_response(301)
            self.send_header("Location", "/pages/")
            self.end_headers()
            return

        # Check if path exists as-is first (normal file handling)
        if os.path.exists("." + path) and not os.path.isdir("." + path):
            return super().do_GET()

        # For paths in pages/ directory, try adding .html
        if path.startswith("/pages/") and not path.endswith(".html"):
            clean_path = path.rstrip("/")
            html_path = clean_path + ".html"

            if os.path.exists("." + html_path):
                # Serve the .html file but keep clean URL in browser
                self.path = html_path + (
                    parsed_path.query and "?" + parsed_path.query or ""
                )
                return super().do_GET()

        # Handle pages/ directory index
        if path == "/pages/":
            self.path = "/pages/index.html"
            return super().do_GET()

        # Default handling
        return super().do_GET()


if __name__ == "__main__":
    PORT = 8080
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🌐 CORS-enabled server running at http://localhost:{PORT}")
        print("📹 This should resolve video preloading CORS issues")
        httpd.serve_forever()
