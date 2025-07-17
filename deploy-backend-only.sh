#!/bin/bash

# deploy-backend-only.sh
# Script to deploy only the backend to Vercel

set -e

echo "🚀 Starting backend-only deployment to Vercel..."
echo "================================================"

# Check if required environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable is not set"
    echo "Please set your Vercel token: export VERCEL_TOKEN=your_token_here"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Create temporary directory for backend-only deployment
TEMP_DIR="temp-backend-deploy"
echo "📁 Creating temporary deployment directory: $TEMP_DIR"

# Clean up any existing temp directory
rm -rf $TEMP_DIR

# Create temp directory
mkdir -p $TEMP_DIR

# Copy only backend-related files
echo "📋 Copying backend files..."
cp -r api $TEMP_DIR/
cp -r ocr_parser $TEMP_DIR/
cp requirements.txt $TEMP_DIR/
cp vercel.json $TEMP_DIR/

# Copy runtime.txt if it exists
if [ -f runtime.txt ]; then
    cp runtime.txt $TEMP_DIR/
    echo "✅ Copied runtime.txt"
fi

# Copy .vercelignore if it exists
if [ -f .vercelignore ]; then
    cp .vercelignore $TEMP_DIR/
    echo "✅ Copied .vercelignore"
fi

echo "✅ Backend files prepared"

# Change to temp directory and deploy
cd $TEMP_DIR

echo "🚀 Deploying to Vercel..."
if [ "$1" == "--production" ] || [ "$1" == "--prod" ]; then
    echo "🎯 Production deployment"
    vercel deploy --prod --token="$VERCEL_TOKEN"
else
    echo "🧪 Preview deployment"
    vercel deploy --token="$VERCEL_TOKEN"
fi

DEPLOY_EXIT_CODE=$?

# Change back to original directory
cd ..

# Clean up temp directory
echo "🧹 Cleaning up..."
rm -rf $TEMP_DIR

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo "✅ Backend deployment successful!"
else
    echo "❌ Backend deployment failed!"
    exit 1
fi

echo "================================================"
echo "🎉 Backend deployment completed!"
