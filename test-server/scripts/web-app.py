#!/usr/bin/env python3
"""
Test Web Application
Simulates a simple web server for testing daemon-admin functionality
"""

import os
import time
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test-web-app')

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = f"""
        <html>
        <head><title>Test Web App</title></head>
        <body>
            <h1>Test Web Application</h1>
            <p>This is a test web application running as a systemd service.</p>
            <p>Current time: {datetime.now()}</p>
            <p>Server started at: {self.server.start_time}</p>
            <p>Requests served: {self.server.request_count}</p>
        </body>
        </html>
        """
        self.wfile.write(html.encode())
        self.server.request_count += 1
    
    def log_message(self, format, *args):
        logger.info("%s - %s" % (self.address_string(), format % args))

class TestWebServer(HTTPServer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_time = datetime.now()
        self.request_count = 0

def main():
    port = int(os.environ.get('PORT', 3000))
    
    logger.info(f"Starting test web application on port {port}")
    
    server = TestWebServer(('0.0.0.0', port), TestHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down web application")
        server.shutdown()

if __name__ == '__main__':
    main() 