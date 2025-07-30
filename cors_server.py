#!/usr/bin/env python3
"""
Simple HTTP server with CORS headers enabled for local development
"""
import http.server
import socketserver


class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


if __name__ == "__main__":
    PORT = 8080
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🌐 CORS-enabled server running at http://localhost:{PORT}")
        print("📹 This should resolve video preloading CORS issues")
        httpd.serve_forever()
