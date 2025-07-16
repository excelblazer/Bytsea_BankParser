"""
Simple health check for the OCR API.
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import subprocess
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Check if tesseract is available
        tesseract_available = False
        tesseract_version = "Not found"
        
        try:
            # Try to run tesseract command
            result = subprocess.run(['tesseract', '--version'], 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE,
                                  text=True)
            if result.returncode == 0:
                tesseract_available = True
                tesseract_version = result.stdout.strip()
        except Exception:
            pass
        
        # Check Python version
        python_version = sys.version
        
        # Get environment info
        env_vars = {}
        for var in ['VERCEL_REGION', 'PYTHONPATH', 'PATH']:
            if var in os.environ:
                env_vars[var] = os.environ.get(var)
        
        # Return as JSON
        response = {
            'status': 'ok',
            'python_version': python_version,
            'tesseract': {
                'available': tesseract_available,
                'version': tesseract_version
            },
            'environment': env_vars
        }
        
        self.wfile.write(json.dumps(response, indent=2).encode())
