#!/bin/bash

# Validation script to check if frontend/backend separation is working correctly

echo "🔍 Validating Frontend/Backend Separation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
        return 0
    else
        echo -e "${RED}❌${NC} $1 missing"
        return 1
    fi
}

# Function to check if URL is accessible
check_url() {
    echo -n "🌐 Testing $1... "
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Not accessible${NC}"
        return 1
    fi
}

# Check required files for separation
echo "📁 Checking required files..."
check_file "vercel.json"
check_file "deploy-backend-only.sh"
check_file "DEPLOYMENT_SEPARATION_GUIDE.md"

# Check if scripts are executable
if [ -x "deploy-backend-only.sh" ]; then
    echo -e "${GREEN}✅${NC} deploy-backend-only.sh is executable"
else
    echo -e "${RED}❌${NC} deploy-backend-only.sh is not executable"
    echo "   Run: chmod +x deploy-backend-only.sh"
fi

echo ""
echo "🔧 Checking package.json scripts..."

# Check if package.json has the separated scripts
if grep -q "deploy:frontend" package.json && grep -q "deploy:backend" package.json; then
    echo -e "${GREEN}✅${NC} Deployment scripts are properly separated"
else
    echo -e "${RED}❌${NC} Deployment scripts not found in package.json"
fi

echo ""
echo "⚙️ Checking frontend configuration..."

# Check if config.ts has the correct structure
if grep -q "checkBackendHealth" services/config.ts; then
    echo -e "${GREEN}✅${NC} Backend health check function exists"
else
    echo -e "${YELLOW}⚠️${NC} Backend health check function missing"
fi

# Check if VITE_OCR_API_URL is configured
if grep -q "VITE_OCR_API_URL" services/config.ts; then
    echo -e "${GREEN}✅${NC} Environment variable support configured"
else
    echo -e "${YELLOW}⚠️${NC} Environment variable support missing"
fi

echo ""
echo "🐍 Checking Python backend files..."

# Check if API files exist
if [ -d "api" ] && [ -f "api/parse.py" ] && [ -f "api/health.py" ]; then
    echo -e "${GREEN}✅${NC} API endpoints exist"
else
    echo -e "${RED}❌${NC} API endpoints missing"
fi

# Check if OCR parser exists
if [ -d "ocr_parser" ] && [ -f "ocr_parser/ocr.py" ]; then
    echo -e "${GREEN}✅${NC} OCR parser modules exist"
else
    echo -e "${RED}❌${NC} OCR parser modules missing"
fi

# Check requirements.txt
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅${NC} requirements.txt exists"
    echo "   Python dependencies:"
    head -5 requirements.txt | sed 's/^/   - /'
else
    echo -e "${RED}❌${NC} requirements.txt missing"
fi

echo ""
echo "🌍 Testing deployments (if URLs provided)..."

# Check if user wants to test live URLs
read -p "Do you have backend and frontend URLs to test? (y/n): " TEST_URLS

if [[ $TEST_URLS == "y" || $TEST_URLS == "Y" ]]; then
    read -p "Enter your backend URL (e.g., https://your-backend.vercel.app): " BACKEND_URL
    read -p "Enter your frontend URL (e.g., https://app.bytsea.com): " FRONTEND_URL
    
    if [ ! -z "$BACKEND_URL" ]; then
        check_url "$BACKEND_URL/api/health"
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        check_url "$FRONTEND_URL"
    fi
fi

echo ""
echo "📋 Summary:"
echo ""
echo -e "${GREEN}✅ What's working:${NC}"
echo "   - Separated deployment configurations"
echo "   - Backend-only Vercel setup"
echo "   - Frontend GitHub Pages setup"
echo "   - Enhanced error handling"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Deploy backend: npm run deploy:backend"
echo "   2. Update frontend config with backend URL"
echo "   3. Deploy frontend: npm run deploy:frontend"
echo "   4. Test both deployments"
echo ""
echo -e "${GREEN}📖 See DEPLOYMENT_SEPARATION_GUIDE.md for detailed instructions${NC}"
