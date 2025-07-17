#!/usr/bin/env python3
"""
Quick OCR Backend Connectivity Test Script

This simple script quickly verifies that your OCR backend is accessible
and responding properly to health check requests.
"""

import requests
import sys
import json

def test_backend(url):
    """Test the OCR backend URL"""
    if not url:
        print("❌ Error: No URL provided")
        print("Usage: python validate_ocr_backend.py <backend-url>")
        sys.exit(1)
        
    # Normalize URL
    if not url.startswith('http'):
        url = f'https://{url}'
    url = url.rstrip('/')
        
    print(f"Testing OCR backend at: {url}")
    print("="*50)
    
    try:
        # Test health endpoint
        health_url = f"{url}/api/health"
        print(f"Checking health endpoint: {health_url}")
        
        response = requests.get(health_url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print("✅ Health check successful!")
        print(f"Status: {data.get('status', 'unknown')}")
        
        # Check Tesseract availability
        tesseract = data.get('features', {}).get('tesseract', {})
        if tesseract.get('available', False):
            print(f"✅ Tesseract is available (version: {tesseract.get('version', 'unknown')})")
        else:
            print("❌ Tesseract is NOT available - OCR functions will fail!")
            
        print("\nEnvironment Information:")
        env = data.get('environment', {})
        for key, value in env.items():
            print(f"  {key}: {value}")
            
        # Update config.ts with this URL
        print("\nTo use this backend in your app, update services/config.ts with:")
        print(f"export const OCR_API_BASE_URL = '{url}';")
        
        # Return success
        return True
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {str(e)}")
        print("\nPossible issues:")
        print("  1. The URL is incorrect")
        print("  2. The Vercel deployment failed")
        print("  3. The API route is not configured correctly")
        return False

if __name__ == "__main__":
    # Get URL from command line argument
    url = sys.argv[1] if len(sys.argv) > 1 else None
    success = test_backend(url)
    sys.exit(0 if success else 1)
