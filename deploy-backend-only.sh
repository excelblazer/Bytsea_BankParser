#!/bin/bash

# Deploy ONLY the backend OCR services to Vercel
# This script ensures that only the Python API backend is deployed to Vercel

echo "🔧 Deploying BACKEND ONLY to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI is not installed. Installing now..."
  npm install -g vercel
fi

# Create a temporary directory for backend-only deployment
TEMP_DIR="temp-backend-deploy"
echo "📁 Creating temporary backend deployment directory..."

# Clean up any existing temp directory
rm -rf $TEMP_DIR

# Create temp directory and copy only backend files
mkdir -p $TEMP_DIR
mkdir -p $TEMP_DIR/api
mkdir -p $TEMP_DIR/ocr_parser

# Copy API files
cp -r api/* $TEMP_DIR/api/
echo "✅ Copied API files"

# Copy OCR parser modules
cp -r ocr_parser/* $TEMP_DIR/ocr_parser/
echo "✅ Copied OCR parser modules"

# Copy requirements.txt
cp requirements.txt $TEMP_DIR/
echo "✅ Copied requirements.txt"

# Copy runtime.txt if it exists
if [ -f runtime.txt ]; then
  cp runtime.txt $TEMP_DIR/
  echo "✅ Copied runtime.txt"
fi

# Copy backend-specific vercel.json
cp vercel.json $TEMP_DIR/
echo "✅ Copied backend Vercel configuration"

# Navigate to temp directory
cd $TEMP_DIR

# Check if user is logged in
VERCEL_TOKEN=$(vercel whoami 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "❌ You are not logged in to Vercel. Please login first:"
  vercel login
fi

# Ask if this is a production deployment
read -p "Deploy to production? (y/n): " PROD_DEPLOY
if [[ $PROD_DEPLOY == "y" || $PROD_DEPLOY == "Y" ]]; then
  DEPLOY_CMD="vercel --prod"
  echo "🚀 Deploying BACKEND to PRODUCTION..."
else
  DEPLOY_CMD="vercel"
  echo "🔍 Deploying BACKEND to PREVIEW environment..."
fi

# Deploy only the backend
echo ""
echo "Starting backend deployment..."
$DEPLOY_CMD

# Store the deployment result
DEPLOY_RESULT=$?

# Navigate back and cleanup
cd ..
rm -rf $TEMP_DIR
echo "🧹 Cleaned up temporary files"

# Check if deployment was successful
if [ $DEPLOY_RESULT -eq 0 ]; then
  echo ""
  echo "✅ Backend deployment successful!"
  echo ""
  echo "📝 IMPORTANT NEXT STEPS:"
  echo "1. Copy the Vercel deployment URL from above"
  echo "2. Update your frontend configuration to use this backend URL"
  echo "3. Deploy your frontend to GitHub Pages using: npm run deploy:gh"
  echo ""
  echo "To test your backend, check these endpoints:"
  echo "  - GET  /api/health (health check)"
  echo "  - POST /api/parse (file parsing)"
else
  echo ""
  echo "❌ Backend deployment failed!"
  exit 1
fi
