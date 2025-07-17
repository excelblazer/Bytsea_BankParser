#!/usr/bin/env python3
"""
OCR Backend Validator

Usage:
python validate_ocr_backend.py [backend_url]

If no backend URL is provided, it will use the default URL.
"""
import sys
import requests
import json

DEFAULT_BACKEND_URL = 'https://bytsea-bank-parser.vercel.app'

def validate_backend(base_url):
    """Test the backend health endpoint and print results."""
    health_url = f"{base_url}/api/health"
    
    print(f"Testing OCR Backend at: {health_url}")
    print("-" * 50)
    
    try:
        response = requests.get(health_url, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nBackend is UP and responding!")
            print("\nResponse data:")
            print(json.dumps(data, indent=2))
            
            # Check for specific features
            if 'features' in data and 'tesseract' in data['features']:
                if data['features']['tesseract']['available']:
                    print("\n✅ Tesseract is available in the backend")
                else:
                    print("\n❌ Tesseract is NOT available - OCR functionality will fail")
            
            return True
        else:
            print(f"\n❌ Backend returned error: {response.status_code}")
            print(response.text)
            return False
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    # Use command line argument or default URL
    backend_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BACKEND_URL
    
    print("OCR Backend Validation Tool")
    print("=" * 50)
    
    success = validate_backend(backend_url)
    
    if success:
        print("\n✅ Backend validation passed!")
        print("\nYou can update the frontend config in services/config.ts")
        print(f"  OCR_API_BASE_URL = '{backend_url}'")
        sys.exit(0)
    else:
        print("\n❌ Backend validation failed!")
        print("\nPlease check your Vercel deployment and ensure:")
        print("1. The backend was deployed successfully with deploy-backend-only.sh")
        print("2. The Python runtime and Tesseract are available in the deployment")
        print("3. The correct URL is being used")
        sys.exit(1)
