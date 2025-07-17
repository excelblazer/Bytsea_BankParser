from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import tempfile
import time
from http.server import BaseHTTPRequestHandler

# Add the project root to path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ocr_parser.preprocessing import pdf_to_images, preprocess_image
from ocr_parser.ocr import extract_text_from_image
from ocr_parser.parser import parse_ledger_text, parse_statement_text
from ocr_parser.cache import FileCache
from ocr_parser.rate_limit import RATE_LIMITER
from PIL import Image
import io
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('ocr_api')

# Initialize cache
cache = FileCache(cache_dir='/tmp/ocr_cache', ttl_days=7)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')  # 24 hours
        self.end_headers()
        
    def do_POST(self):
        start_time = time.time()
        
        # Get client IP for rate limiting
        client_ip = self.headers.get('x-forwarded-for', self.client_address[0])
        if ',' in client_ip:  # Handle multiple IPs in forwarded-for
            client_ip = client_ip.split(',')[0].strip()
        
        # Get content length and read the request body
        try:
            content_length = int(self.headers['Content-Length'])
            if content_length > 5 * 1024 * 1024:  # 5MB limit for Vercel
                self.send_error_response(413, "File too large (max 5MB)")
                return
                
            post_data = self.rfile.read(content_length)
        except Exception as e:
            logger.error(f"Error reading request: {str(e)}")
            self.send_error_response(500, f"Error processing request: {str(e)}")
            return
        
        # Parse multipart/form-data
        try:
            boundary = self.headers['Content-Type'].split('=')[1].encode()
            parts = post_data.split(boundary)
        
            file_part = None
            parser_type = 'statement'  # Default value
            
            for part in parts:
                if b'filename=' in part:
                    file_part = part
                elif b'name="parserType"' in part:
                    parser_type_value = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8')
                    if parser_type_value:
                        parser_type = parser_type_value
        except Exception as e:
            logger.error(f"Error parsing form data: {str(e)}")
            self.send_error_response(400, "Invalid form data")
            return
        
        if not file_part:
            self.send_error_response(400, "No file uploaded")
            return
        
        # Extract filename
        try:
            filename_part = file_part.split(b'filename=')[1].split(b'\r\n')[0]
            filename = filename_part.strip(b'"').decode('utf-8')
            ext = os.path.splitext(filename)[1].lower()
        except Exception as e:
            logger.error(f"Error extracting filename: {str(e)}")
            self.send_error_response(400, "Invalid file data")
            return
        
        # Get file content
        try:
            file_content = file_part.split(b'\r\n\r\n')[1].rsplit(b'\r\n', 1)[0]
        except Exception as e:
            logger.error(f"Error extracting file content: {str(e)}")
            self.send_error_response(400, "Invalid file content")
            return
        
        # Check cache first
        cache_result = cache.get(file_content, parser_type)
        if cache_result:
            logger.info(f"Cache hit for {filename} with parser {parser_type}")
            self.send_json_response(200, {'result': cache_result, 'cache': 'hit'})
            return
            
        # Apply rate limiting
        if not RATE_LIMITER.can_process(client_ip):
            retry_after = RATE_LIMITER.get_retry_after(client_ip)
            logger.warning(f"Rate limit exceeded for {client_ip}, retry after {retry_after}s")
            self.send_response(429)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Retry-After', str(retry_after))
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Too many requests', 
                'retryAfter': retry_after
            }).encode())
            return
        
        # Process the file
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                file_path = os.path.join(tmpdir, filename)
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                
                images = []
                if ext == '.pdf':
                    images = pdf_to_images(file_path)
                elif ext in ['.jpg', '.jpeg', '.png', '.webp']:
                    image = Image.open(file_path)
                    images = [image]
                else:
                    self.send_error_response(400, "Unsupported file type")
                    return
                
                if not images:
                    self.send_error_response(400, "No images extracted from file")
                    return
                
                # Apply rate limiting based on page count
                page_count = len(images)
                if not RATE_LIMITER.can_process(client_ip, page_count):
                    retry_after = RATE_LIMITER.get_retry_after(client_ip, page_count)
                    logger.warning(f"Rate limit exceeded for {client_ip} with {page_count} pages, retry after {retry_after}s")
                    self.send_response(429)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                    self.send_header('Retry-After', str(retry_after))
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Too many pages, rate limit exceeded', 
                        'retryAfter': retry_after
                    }).encode())
                    return
                
                texts = []
                for img in images:
                    pre_img = preprocess_image(img)
                    text = extract_text_from_image(pre_img)
                    texts.append(text)
                
                full_text = '\n'.join(texts)
                
                if parser_type == 'ledger':
                    result = parse_ledger_text(full_text)
                else:
                    result = parse_statement_text(full_text)
                
                # Cache the result
                cache.set(file_content, parser_type, result)
                
                processing_time = time.time() - start_time
                logger.info(f"Processed {filename} with {len(images)} pages in {processing_time:.2f}s")
                
                self.send_json_response(200, {'result': result})
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            self.send_error_response(500, f"Error processing file: {str(e)}")
            
    def send_json_response(self, status_code, data):
        """Helper to send JSON responses with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
            
    def send_error_response(self, status_code, error_message):
        """Helper to send error responses with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps({'error': error_message}).encode())

handler = VercelHTTPHandler
