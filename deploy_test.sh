#!/bin/bash

# Vercel deployment script for minimal test version

echo "==== Vercel Test Deployment Script ===="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI is not installed. Installing now..."
  npm install -g vercel
fi

# Go to the deployment directory
cd "$(dirname "$0")/.vercel-deploy" || exit 1

# Clean up any existing Vercel files
rm -rf .vercel

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
echo "Starting deployment of minimal test version..."
$DEPLOY_CMD

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Test deployment successful!"
  echo ""
  echo "Test the health endpoint by adding /api/health to the URL"
else
  echo ""
  echo "❌ Deployment failed. Check the error messages above."
fi
