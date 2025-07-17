#!/bin/bash

# validate-separation.sh
# Script to validate the separation of frontend and backend components

set -e

echo "🔍 Validating frontend/backend separation..."
echo "============================================"

# Function to check if a file/directory exists
check_exists() {
    if [ ! -e "$1" ]; then
        echo "❌ Missing: $1"
        return 1
    else
        echo "✅ Found: $1"
        return 0
    fi
}

# Function to check if a file contains specific content
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $1 contains: $2"
        return 0
    else
        echo "❌ $1 missing: $2"
        return 1
    fi
}

echo ""
echo "📋 Checking backend components..."
echo "--------------------------------"

BACKEND_VALID=true

# Check backend files
check_exists "api/health.py" || BACKEND_VALID=false
check_exists "api/parse.py" || BACKEND_VALID=false
check_exists "ocr_parser" || BACKEND_VALID=false
check_exists "ocr_parser/__init__.py" || BACKEND_VALID=false
check_exists "requirements.txt" || BACKEND_VALID=false
check_exists "vercel.json" || BACKEND_VALID=false

# Check OCR parser components
check_exists "ocr_parser/ocr.py" || BACKEND_VALID=false
check_exists "ocr_parser/parser.py" || BACKEND_VALID=false
check_exists "ocr_parser/preprocessing.py" || BACKEND_VALID=false
check_exists "ocr_parser/cache.py" || BACKEND_VALID=false
check_exists "ocr_parser/rate_limit.py" || BACKEND_VALID=false

echo ""
echo "🎨 Checking frontend components..."
echo "----------------------------------"

FRONTEND_VALID=true

# Check frontend files
check_exists "package.json" || FRONTEND_VALID=false
check_exists "index.html" || FRONTEND_VALID=false
check_exists "App.tsx" || FRONTEND_VALID=false
check_exists "components" || FRONTEND_VALID=false
check_exists "services" || FRONTEND_VALID=false

echo ""
echo "⚙️ Checking configuration files..."
echo "-----------------------------------"

CONFIG_VALID=true

# Check vercel.json configuration
if [ -f "vercel.json" ]; then
    check_content "vercel.json" '"@vercel/python"' || CONFIG_VALID=false
    check_content "vercel.json" '"includeFiles": "ocr_parser/\*\*"' || CONFIG_VALID=false
    echo "✅ vercel.json configured for backend deployment"
else
    echo "❌ vercel.json not found"
    CONFIG_VALID=false
fi

# Check package.json scripts
if [ -f "package.json" ]; then
    check_content "package.json" '"deploy:backend"' || CONFIG_VALID=false
    check_content "package.json" '"deploy:frontend"' || CONFIG_VALID=false
    echo "✅ package.json has deployment scripts"
else
    echo "❌ package.json not found"
    CONFIG_VALID=false
fi

echo ""
echo "🔗 Checking service configuration..."
echo "------------------------------------"

SERVICE_VALID=true

# Check frontend service configuration
if [ -f "services/config.ts" ]; then
    if grep -q "OCR_API_BASE_URL" "services/config.ts"; then
        echo "✅ Frontend configured with backend URL"
    else
        echo "❌ Frontend missing backend URL configuration"
        SERVICE_VALID=false
    fi
else
    echo "❌ services/config.ts not found"
    SERVICE_VALID=false
fi

echo ""
echo "📊 Validation Summary"
echo "===================="

if [ "$BACKEND_VALID" = true ]; then
    echo "✅ Backend components: VALID"
else
    echo "❌ Backend components: INVALID"
fi

if [ "$FRONTEND_VALID" = true ]; then
    echo "✅ Frontend components: VALID"
else
    echo "❌ Frontend components: INVALID"
fi

if [ "$CONFIG_VALID" = true ]; then
    echo "✅ Configuration files: VALID"
else
    echo "❌ Configuration files: INVALID"
fi

if [ "$SERVICE_VALID" = true ]; then
    echo "✅ Service configuration: VALID"
else
    echo "❌ Service configuration: INVALID"
fi

echo ""

# Overall validation result
if [ "$BACKEND_VALID" = true ] && [ "$FRONTEND_VALID" = true ] && [ "$CONFIG_VALID" = true ] && [ "$SERVICE_VALID" = true ]; then
    echo "🎉 Validation PASSED! Project is ready for separated deployment."
    exit 0
else
    echo "⚠️ Validation FAILED! Please fix the issues above before deployment."
    exit 1
fi
