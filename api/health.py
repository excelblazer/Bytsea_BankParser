from http.server import BaseHTTPRequestHandler
import sys
import os
import json
import logging
import platform

# Add the project root to path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ocr_parser.cache import FileCache
from ocr_parser.rate_limit import RATE_LIMITER

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('ocr_api')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Optional: clean up old cache entries periodically when health is checked
        cache_dir = '/tmp/ocr_cache'
        cache = FileCache(cache_dir=cache_dir, ttl_days=1)  # Shorter TTL for Vercel
        removed = cache.cleanup()
        
        logger.info(f"Health check: Removed {removed} expired cache entries")
        
        # Get system information
        region = os.environ.get('VERCEL_REGION', 'unknown')
        is_vercel = os.environ.get('VERCEL_DEPLOYMENT') == 'true'
        python_version = platform.python_version()
        
        # Check if Tesseract is installed
        tesseract_available = False
        tesseract_version = "Not found"
        try:
            import pytesseract
            tesseract_version = pytesseract.get_tesseract_version()
            tesseract_available = True
        except Exception:
            pass
        
        # Get cache stats
        cache_size = 0
        cache_files = 0
        try:
            if os.path.exists(cache_dir):
                for filename in os.listdir(cache_dir):
                    if filename.endswith('.json'):
                        cache_files += 1
                        try:
                            filepath = os.path.join(cache_dir, filename)
                            cache_size += os.path.getsize(filepath)
                        except OSError:
                            pass
        except Exception:
            pass
            
        # Add CORS headers to support frontend requests
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(json.dumps({
            'status': 'ok',
            'environment': {
                'region': region,
                'isVercel': is_vercel,
                'pythonVersion': python_version,
            },
            'features': {
                'tesseract': {
                    'available': tesseract_available,
                    'version': tesseract_version
                }
            },
            'rateLimit': {
                'perMinute': RATE_LIMITER.tokens_per_minute,
                'maxTokens': RATE_LIMITER.max_tokens,
                'costPerPage': RATE_LIMITER.cost_per_page
            },
            'cache': {
                'expiredRemoved': removed,
                'files': cache_files,
                'sizeMB': round(cache_size / (1024 * 1024), 2)
            }
        }).encode())
        return

handler = VercelHTTPHandler
