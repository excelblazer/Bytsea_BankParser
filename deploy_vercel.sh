#!/bin/bash

# A helper script to deploy to Vercel for testing

echo "==== Vercel Backend Deployment Script ===="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI is not installed. Installing now..."
  npm install -g vercel
fi

# Ask if user wants to clear previous deployment cache
read -p "Clean previous Vercel deployment files? (y/n): " CLEAN_DEPLOY
if [[ $CLEAN_DEPLOY == "y" || $CLEAN_DEPLOY == "Y" ]]; then
  echo "🧹 Cleaning previous deployment files..."
  rm -rf .vercel
  echo "✅ Cleaned .vercel directory"
fi

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
  echo "🚀 Deploying to PRODUCTION..."
else
  DEPLOY_CMD="vercel"
  echo "🔍 Deploying to PREVIEW environment..."
fi

# Deploy
echo ""
echo "Starting deployment..."
$DEPLOY_CMD

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  echo "To test your backend, run:"
  echo "python test_vercel_deployment.py <your-vercel-url>"
  echo ""
  echo "To update your frontend config:"
  echo "1. Copy the Vercel URL"
  echo "2. Update the OCR_API_BASE_URL in services/config.ts"
  echo "   or set the VITE_OCR_API_URL in .env.local"
else
  echo ""
  echo "❌ Deployment failed. Check the error messages above."
fi
