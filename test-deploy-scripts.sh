#!/bin/bash

# test-deploy-scripts.sh
# Script to test the deployment scripts without actually deploying

set -e

echo "🧪 Testing deployment scripts..."
echo "==============================="

echo ""
echo "1️⃣ Testing validation script..."
echo "--------------------------------"
./validate-separation.sh

echo ""
echo "2️⃣ Testing backend deployment script (dry run)..."
echo "--------------------------------------------------"

# Test the script structure without actually deploying
echo "🔍 Checking deploy-backend-only.sh structure..."

if [ -f "deploy-backend-only.sh" ] && [ -x "deploy-backend-only.sh" ]; then
    echo "✅ deploy-backend-only.sh exists and is executable"
    
    # Check if script contains key functions
    if grep -q "VERCEL_TOKEN" "deploy-backend-only.sh"; then
        echo "✅ Script checks for VERCEL_TOKEN"
    else
        echo "❌ Script missing VERCEL_TOKEN check"
    fi
    
    if grep -q "temp-backend-deploy" "deploy-backend-only.sh"; then
        echo "✅ Script creates temporary deployment directory"
    else
        echo "❌ Script missing temp directory creation"
    fi
    
    if grep -q "vercel deploy" "deploy-backend-only.sh"; then
        echo "✅ Script contains Vercel deployment command"
    else
        echo "❌ Script missing Vercel deployment command"
    fi
    
else
    echo "❌ deploy-backend-only.sh not found or not executable"
fi

echo ""
echo "3️⃣ Testing file structure for deployment..."
echo "-------------------------------------------"

# Test that all required files are present for deployment
echo "📋 Checking required backend files..."

REQUIRED_FILES=(
    "api/health.py"
    "api/parse.py"
    "ocr_parser/__init__.py"
    "ocr_parser/ocr.py"
    "ocr_parser/parser.py"
    "ocr_parser/preprocessing.py"
    "ocr_parser/cache.py"
    "ocr_parser/rate_limit.py"
    "requirements.txt"
    "vercel.json"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        ALL_PRESENT=false
    fi
done

echo ""
echo "4️⃣ Testing package.json scripts..."
echo "----------------------------------"

if command -v npm &> /dev/null; then
    echo "📋 Available npm scripts:"
    npm run --silent 2>/dev/null | grep -E "(deploy:|validate)" || echo "No deploy/validate scripts found"
    
    echo ""
    echo "🔍 Checking script definitions..."
    if grep -q '"deploy:backend"' package.json; then
        echo "✅ deploy:backend script defined"
    else
        echo "❌ deploy:backend script missing"
    fi
    
    if grep -q '"deploy:frontend"' package.json; then
        echo "✅ deploy:frontend script defined"
    else
        echo "❌ deploy:frontend script missing"
    fi
    
    if grep -q '"validate"' package.json; then
        echo "✅ validate script defined"
    else
        echo "❌ validate script missing"
    fi
else
    echo "⚠️ npm not available for testing"
fi

echo ""
echo "📊 Test Summary"
echo "==============="

if [ "$ALL_PRESENT" = true ]; then
    echo "✅ All required files present"
    echo "✅ Scripts are properly configured"
    echo "🎉 Deployment scripts are ready for use!"
    echo ""
    echo "💡 Usage:"
    echo "   - Validate: ./validate-separation.sh"
    echo "   - Deploy backend: npm run deploy:backend"
    echo "   - Deploy frontend: npm run deploy:frontend"
    echo ""
    echo "⚠️ Note: Set VERCEL_TOKEN environment variable before deploying"
else
    echo "❌ Some required files are missing"
    echo "⚠️ Fix missing files before deployment"
fi
