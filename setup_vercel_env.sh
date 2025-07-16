#!/bin/bash

# Setup script for Vercel environment variables

echo "==== Vercel Environment Setup Script ===="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI is not installed. Installing now..."
  npm install -g vercel
fi

# Check if user is logged in
VERCEL_TOKEN=$(vercel whoami 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "❌ You are not logged in to Vercel. Please login first:"
  vercel login
fi

# Get project ID and org ID if .vercel directory exists
if [ -f ".vercel/project.json" ]; then
  PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId": "[^"]*' | cut -d'"' -f4)
  ORG_ID=$(cat .vercel/project.json | grep -o '"orgId": "[^"]*' | cut -d'"' -f4)
  
  echo "Found existing Vercel project:"
  echo "- Project ID: $PROJECT_ID"
  echo "- Org ID: $ORG_ID"
else
  echo "No existing Vercel project found. Please run 'vercel' once to link your project."
  exit 1
fi

# Create or modify environment variables
echo ""
echo "Setting up environment variables for Vercel..."
echo ""

echo "Setting PYTHONPATH=."
vercel env add PYTHONPATH production . --yes

echo "Setting VERCEL_DEPLOYMENT=true"
vercel env add VERCEL_DEPLOYMENT production true --yes

# Print helpful information for GitHub Actions
echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "For GitHub Actions integration, you need these values:"
echo "=================================================================="
echo "VERCEL_PROJECT_ID: $PROJECT_ID"
echo "VERCEL_ORG_ID: $ORG_ID"
echo "VERCEL_TOKEN: Create at https://vercel.com/account/tokens"
echo "=================================================================="
echo ""
echo "Add these as secrets in your GitHub repository:"
echo "https://github.com/$(git config --get remote.origin.url | sed -e 's/.*github.com[:\/]\(.*\).git/\1/')/settings/secrets/actions"
echo ""
