#!/bin/bash

# This script is used by Vercel to build the project

echo "Setting up Python environment..."
echo "Python version: $(python3 --version)"

# Create necessary directories
mkdir -p /tmp/ocr_cache

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Print out the Tesseract version if available
if command -v tesseract &> /dev/null; then
    echo "Tesseract is available: $(tesseract --version | head -n 1)"
else
    echo "WARNING: Tesseract is NOT available"
    
    # Try to install Tesseract if possible
    if apt-get -v &> /dev/null; then
        echo "Attempting to install Tesseract via apt..."
        apt-get update -qq && apt-get install -y -qq tesseract-ocr
    fi
fi

# Check if Tesseract is now available
if command -v tesseract &> /dev/null; then
    echo "✓ Tesseract is now available: $(tesseract --version | head -n 1)"
else
    echo "✗ Tesseract is still not available"
fi

echo "Build completed"
