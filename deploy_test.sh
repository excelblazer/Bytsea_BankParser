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
VERCEL_URL=$($DEPLOY_CMD)
DEPLOY_STATUS=$?

# Check if deployment was successful
if [ $DEPLOY_STATUS -eq 0 ]; then
  echo ""
  echo "✅ Test deployment successful at: $VERCEL_URL"
  echo ""
  
  # Test the health endpoint
  echo "Testing health endpoint at $VERCEL_URL/api/health..."
  echo "Waiting for deployment to fully propagate (15 seconds)..."
  sleep 15
  
  # First test OPTIONS for CORS preflight
  echo "Testing OPTIONS preflight request..."
  curl -s -I -X OPTIONS "$VERCEL_URL/api/health"
  
  # Now try the GET request
  echo ""
  echo "Testing GET request..."
  HEALTH_STATUS=$(curl -s -w "\nStatus: %{http_code}" "$VERCEL_URL/api/health")
  HEALTH_CODE=$(echo "$HEALTH_STATUS" | grep "Status:" | cut -d' ' -f2)
  
  echo "$HEALTH_STATUS"
  
  if [ "$HEALTH_CODE" == "200" ]; then
    echo "✅ Health check passed!"
  else
    echo "⚠️ Health check returned status $HEALTH_CODE"
    echo "This might indicate an issue with the deployment."
  fi
else
  echo ""
  echo "❌ Deployment failed. Check the error messages above."
fi
