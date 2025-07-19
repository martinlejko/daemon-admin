#!/usr/bin/env python3
"""
Test API Server
Simulates a REST API server for testing daemon-admin functionality
"""

import os
import json
import time
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test-api-server')

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.send_health_response()
        elif path == '/status':
            self.send_status_response()
        elif path == '/metrics':
            self.send_metrics_response()
        elif path.startswith('/api/'):
            self.send_api_response(path)
        else:
            self.send_not_found()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            self.send_api_post_response(path, post_data)
        else:
            self.send_not_found()
    
    def send_health_response(self):
        self.send_json_response({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'uptime': (datetime.now() - self.server.start_time).total_seconds()
        })
    
    def send_status_response(self):
        self.send_json_response({
            'service': 'test-api-server',
            'version': '1.0.0',
            'started_at': self.server.start_time.isoformat(),
            'requests_served': self.server.request_count,
            'redis_connected': True,  # Simulated
            'database_connected': True  # Simulated
        })
    
    def send_metrics_response(self):
        self.send_json_response({
            'requests_total': self.server.request_count,
            'requests_per_minute': self.server.request_count / max(1, (datetime.now() - self.server.start_time).total_seconds() / 60),
            'memory_usage_mb': 45.2,  # Simulated
            'cpu_usage_percent': 12.5,  # Simulated
            'response_time_ms': 150  # Simulated
        })
    
    def send_api_response(self, path):
        if path == '/api/users':
            self.send_json_response({
                'users': [
                    {'id': 1, 'name': 'John Doe', 'email': 'john@example.com'},
                    {'id': 2, 'name': 'Jane Smith', 'email': 'jane@example.com'}
                ]
            })
        elif path == '/api/tasks':
            self.send_json_response({
                'tasks': [
                    {'id': 1, 'title': 'Sample Task', 'completed': False},
                    {'id': 2, 'title': 'Another Task', 'completed': True}
                ]
            })
        else:
            self.send_not_found()
    
    def send_api_post_response(self, path, data):
        try:
            json_data = json.loads(data.decode('utf-8')) if data else {}
            self.send_json_response({
                'message': 'Data received successfully',
                'path': path,
                'data': json_data,
                'timestamp': datetime.now().isoformat()
            }, status=201)
        except json.JSONDecodeError:
            self.send_json_response({'error': 'Invalid JSON'}, status=400)
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
        self.server.request_count += 1
    
    def send_not_found(self):
        self.send_json_response({'error': 'Not found'}, status=404)
    
    def log_message(self, format, *args):
        logger.info("%s - %s" % (self.address_string(), format % args))

class TestAPIServer(HTTPServer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_time = datetime.now()
        self.request_count = 0

def main():
    port = int(os.environ.get('API_PORT', 8080))
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    
    logger.info(f"Starting test API server on port {port}")
    logger.info(f"Redis URL: {redis_url}")
    
    server = TestAPIServer(('0.0.0.0', port), APIHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down API server")
        server.shutdown()

if __name__ == '__main__':
    main() 