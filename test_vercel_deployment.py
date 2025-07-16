#!/usr/bin/env python3
"""
Vercel Deployment Test Script

This script tests the deployed OCR API endpoints on Vercel.
Run it after deploying your backend to verify functionality.

Usage:
  python test_vercel_deployment.py https://your-vercel-url.vercel.app
"""

import sys
import requests
import json
import time
from pprint import pprint

def test_health_endpoint(base_url):
    """Test the health endpoint"""
    url = f"{base_url}/api/health"
    print(f"Testing health endpoint: {url}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        print("✅ Health check successful")
        print("\nEnvironment Info:")
        print(f"  Region: {data.get('environment', {}).get('region', 'unknown')}")
        print(f"  Python: {data.get('environment', {}).get('pythonVersion', 'unknown')}")
        
        # Check Tesseract availability
        tesseract = data.get('features', {}).get('tesseract', {})
        if tesseract.get('available', False):
            print(f"\n✅ Tesseract available (version: {tesseract.get('version', 'unknown')})")
        else:
            print("\n❌ Tesseract not available!")
            
        # Print rate limit info
        rate_limit = data.get('rateLimit', {})
        print("\nRate Limiting:")
        print(f"  Tokens per minute: {rate_limit.get('perMinute', 'unknown')}")
        print(f"  Max tokens: {rate_limit.get('maxTokens', 'unknown')}")
        print(f"  Cost per page: {rate_limit.get('costPerPage', 'unknown')}")
        
        # Print cache info
        cache = data.get('cache', {})
        print("\nCache Status:")
        print(f"  Files: {cache.get('files', 'unknown')}")
        print(f"  Size: {cache.get('sizeMB', 'unknown')} MB")
        print(f"  Expired removed: {cache.get('expiredRemoved', 'unknown')}")
        
        return True
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <vercel-url>")
        print("Example: python test_vercel_deployment.py https://bytsea-bank-parser-api.vercel.app")
        return
        
    base_url = sys.argv[1].rstrip('/')
    
    print("=" * 60)
    print(f"Testing Vercel deployment at: {base_url}")
    print("=" * 60)
    
    # Test health endpoint
    health_ok = test_health_endpoint(base_url)
    
    # Overall status
    print("\n" + "=" * 60)
    if health_ok:
        print("✅ Deployment verification successful!")
        print(f"\nYour OCR API is ready at: {base_url}")
        print("\nUpdate your frontend config in services/config.ts:")
        print(f'export const OCR_API_BASE_URL = "{base_url}";')
    else:
        print("❌ Deployment verification failed!")
        print("Check Vercel logs for more details.")
    print("=" * 60)

if __name__ == "__main__":
    main()
