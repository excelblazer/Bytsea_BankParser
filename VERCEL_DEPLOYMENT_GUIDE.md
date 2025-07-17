# Backend-Only Vercel Deployment Guide

This guide helps you deploy **only the OCR backend services** to Vercel. The frontend is deployed separately to GitHub Pages.

## ⚠️ Important: Backend-Only Deployment

This deployment now only deploys the Python OCR services to Vercel. The React frontend is deployed separately to GitHub Pages for better performance and cost efficiency.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed locally (`npm install -g vercel`)
3. GitHub repository for the project

## Quick Deployment

### Option 1: Use the Script (Recommended)

```bash
# Deploy only the OCR backend services
npm run deploy:backend
```

This script will:
- Create a temporary directory with only backend files (API + OCR modules)
- Deploy to Vercel with backend-only configuration
- Provide the backend URL for frontend configuration
- Clean up temporary files

### Option 2: Manual Deployment

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy Backend Only**:
   ```bash
   # The deploy script handles this automatically, but manually:
   # - Copy api/, ocr_parser/, requirements.txt, vercel.json to temp folder
   # - Deploy from temp folder
   # - Clean up
   ```

## Testing the Backend Deployment

After deployment, test your backend:

### 1. Health Check
```bash
# Test the health endpoint
curl https://your-backend-url.vercel.app/api/health
```

Should return JSON with service status and system info.

### 2. Using the Validation Script
```bash
# Use the Python validation script
python validate_ocr_backend.py https://your-backend-url.vercel.app
```

## Setting Up GitHub Actions (Optional)

For automated deployment, add these secrets to your GitHub repository:

1. **VERCEL_TOKEN**: Create at https://vercel.com/account/tokens
2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**: Get from `.vercel/project.json` after first deployment

The GitHub workflow will automatically deploy backend changes to Vercel and frontend changes to GitHub Pages.

## Connecting Frontend to Backend

After backend deployment, update your frontend configuration:

### Option 1: Environment Variable
```bash
# Create .env.production
echo "VITE_OCR_API_URL=https://your-backend-url.vercel.app" > .env.production
```

### Option 2: Update Config File
Edit `services/config.ts`:
```typescript
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_OCR_API_URL || 'https://your-backend-url.vercel.app'
  : 'http://localhost:8000';
```

Then deploy your frontend:
```bash
npm run deploy:frontend
```

## Architecture Benefits

✅ **Separated Concerns**: Frontend and backend deploy independently  
✅ **Cost Efficient**: GitHub Pages is free, Vercel backend-only  
✅ **Performance**: Frontend served from GitHub's CDN  
✅ **Scalability**: Backend auto-scales with demand  

## Troubleshooting

### Common Issues

**CORS Errors**: Verify CORS headers in `vercel.json` are correct

**Function Timeout**: Check Vercel function logs for processing issues

**Health Check Fails**: Backend may need 20-30 seconds to "wake up" on first request

**Build Errors**: Ensure all Python dependencies are in `requirements.txt`

### Getting Help

- Check `DEPLOYMENT_SEPARATION_GUIDE.md` for complete setup instructions
- Run `./validate-separation.sh` to verify your local configuration
- Use `python validate_ocr_backend.py <url>` to test backend connectivity

## Migration from Old Setup

If you previously deployed the full app to Vercel, see `MIGRATION_GUIDE.md` for step-by-step migration instructions.

## File Structure

Key backend files deployed to Vercel:
- `api/health.py`: Health check endpoint
- `api/parse.py`: OCR processing endpoint
- `ocr_parser/`: Core OCR functionality modules
- `requirements.txt`: Python dependencies
- `vercel.json`: Backend-only Vercel configuration

## Rate Limiting

The backend has conservative rate limiting:
- 30 tokens per minute
- Each page OCR request costs 5 tokens
- Allows processing ~6 pages per minute on free tier
