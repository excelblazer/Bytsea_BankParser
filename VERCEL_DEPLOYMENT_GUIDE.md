# Vercel Deployment Guide for Bytsea Bank Parser

This guide helps you deploy the OCR backend service to Vercel and connect it to your GitHub Pages frontend.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed locally (`npm install -g vercel`)
3. GitHub repository for the project

## Deployment Steps

### 1. Local Deployment Testing

You can deploy locally for testing before setting up automated deployment:

```bash
# Run the deployment script
bash deploy_vercel.sh
```

The script will:
- Clean previous deployment files if needed
- Log you in to Vercel if necessary
- Deploy to a preview or production environment
- Show the resulting URL for testing

### 2. Testing the Deployment

After deploying, test if your backend is working correctly:

```bash
python test_vercel_deployment.py <your-vercel-url>
```

This will check if:
- The health endpoint is responding
- Tesseract is available on the server
- Rate limiting is configured properly
- Cache system is working

### 3. Setting Up GitHub Actions for Automated Deployment

Create a GitHub Actions workflow file at `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - 'ocr_parser/**'
      - 'vercel.json'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          vercel deploy --prod --token=$VERCEL_TOKEN
          
      - name: Test Deployment
        run: |
          # Get the production URL from Vercel
          VERCEL_URL=$(vercel --token=${{ secrets.VERCEL_TOKEN }} ls -m 1 ${{ github.repository }} | grep ${{ github.repository }} | awk '{print $2}')
          echo "Deployed to: $VERCEL_URL"
          
          # Test the deployment
          python test_vercel_deployment.py $VERCEL_URL
          
      - name: Update Frontend Config
        if: success()
        run: |
          # Commit and push the new API URL to the GitHub Pages repository
          # This step would update the API URL in your frontend config
          # You could also set it as a repository variable
```

### 4. Getting Required Secrets

To set up GitHub Actions, you need to add these secrets to your repository:

1. **VERCEL_TOKEN**: Create at https://vercel.com/account/tokens
2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**: Run these commands after deployment:
   ```bash
   cat .vercel/project.json | grep projectId
   cat .vercel/project.json | grep orgId
   ```

### 5. Connecting Frontend to Backend

Update your frontend config in `services/config.ts`:

```typescript
export const OCR_API_BASE_URL = process.env.VITE_OCR_API_URL || 'https://your-vercel-url.vercel.app';
```

Or set it as an environment variable during frontend build:
```bash
VITE_OCR_API_URL=https://your-vercel-url.vercel.app npm run build
```

## Troubleshooting

### Deployment Errors

If you see `If 'rewrites', 'redirects', 'headers', etc. are used, then 'routes' cannot be present`:
- You're mixing old and new Vercel configuration styles
- Use only modern properties as shown in the current `vercel.json`

### CORS Issues

If you're seeing CORS errors in the browser console:
- Make sure your frontend URL is properly set in the headers section of `vercel.json`
- Remember to use the full URL including `https://`

### Rate Limiting

The backend has rate limiting configured:
- 30 tokens per minute
- Each page OCR request costs 5 tokens
- This allows processing ~6 pages per minute

## Environment Variables

These variables are automatically set during deployment:
- `PYTHONPATH=.`: Ensures Python can find all modules
- `VERCEL_DEPLOYMENT=true`: Indicates we're running on Vercel

## File Structure

Key backend files:
- `api/health.py`: Health check endpoint
- `api/parse.py`: OCR processing endpoint
- `ocr_parser/`: Core OCR functionality
- `vercel.json`: Vercel deployment configuration
