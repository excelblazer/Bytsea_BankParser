from http.server import BaseHTTPRequestHandler
import sys
import os
import json
import platform

# Add the project root to path so we can import our modules if needed
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Get system information
        region = os.environ.get('VERCEL_REGION', 'unknown')
        python_version = platform.python_version()
        
        # Check if Tesseract is installed
        tesseract_available = False
        tesseract_version = "Not available"
        
        try:
            import pytesseract
            try:
                tesseract_version = pytesseract.get_tesseract_version()
                tesseract_available = True
            except:
                try:
                    import subprocess
                    result = subprocess.run(['tesseract', '--version'], 
                                          stdout=subprocess.PIPE, 
                                          stderr=subprocess.PIPE,
                                          text=True)
                    if result.returncode == 0:
                        tesseract_available = True
                        tesseract_version = result.stdout.strip().split('\n')[0]
                except:
                    pass
        except:
            pass
        
        # Get environment variables
        env_info = {
            'VERCEL': os.environ.get('VERCEL', 'Not set'),
            'VERCEL_REGION': region,
            'PYTHONPATH': os.environ.get('PYTHONPATH', 'Not set')
        }
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Prepare response data
        response_data = {
            'status': 'ok',
            'message': 'Vercel API is up and running',
            'environment': {
                'region': region,
                'pythonVersion': python_version
            },
            'features': {
                'tesseract': {
                    'available': tesseract_available,
                    'version': tesseract_version
                }
            },
            'env': env_info,
            'timestamp': str(os.times())
        }
        
        self.wfile.write(json.dumps(response_data, indent=2).encode())
