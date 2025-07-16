# Bytsea Bank Parser OCR Backend Deployment

This guide explains how to deploy and test your Python Flask OCR backend on Vercel.

## Overview of Changes Made

1. **Vercel Configuration**
   - Updated `vercel.json` with proper function settings
   - Set maximum duration to 60 seconds and memory to 2GB

2. **Cache System Enhancement**
   - Modified `cache.py` to work better with Vercel's `/tmp` storage
   - Added aggressive cache cleanup to stay within Vercel limits
   - Set shorter TTL for cache entries (1 day)

3. **Rate Limiting**
   - Adjusted rate limits to be more conservative for the free tier
   - Reduced tokens per minute from 60 to 30
   - Decreased max tokens from 120 to 60

4. **CORS Support**
   - Added CORS headers to all responses
   - Implemented OPTIONS method for preflight requests

5. **Dependency Updates**
   - Updated `requirements.txt` with Vercel-compatible dependencies

6. **Health Endpoint Improvements**
   - Enhanced `/api/health` to provide detailed environment information
   - Added Tesseract version and availability check

7. **Testing Script**
   - Created `test_vercel_deployment.py` to verify successful deployment

## Deployment Steps

### 1. Push code to GitHub

```bash
git add .
git commit -m "Update backend for Vercel deployment"
git push
```

### 2. Deploy to Vercel

#### Method 1: Vercel Dashboard

1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure as follows:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Environment Variables:
     - `PYTHONPATH`: `.`
     - `VERCEL_DEPLOYMENT`: `true`

#### Method 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Follow the prompts to complete the deployment.

### 3. Test Deployment

Once deployed, test your backend:

```bash
python test_vercel_deployment.py https://your-vercel-url.vercel.app
```

### 4. Update Frontend Configuration

Update the API URL in your frontend configuration:

```typescript
// In services/config.ts
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-vercel-url.vercel.app' 
  : 'http://localhost:3000';
```

## Monitoring and Maintenance

- Check the health endpoint regularly: `/api/health`
- Monitor Vercel usage dashboard for function execution metrics
- Review function logs for errors
- If needed, adjust rate limits in `ocr_parser/rate_limit.py`

## Architecture Overview

```
Frontend (GitHub Pages) <----> Backend (Vercel Serverless Functions)
                                |
                                v
                       Cache (/tmp directory)
                                |
                                v
                       OCR Processing (Tesseract)
```

This separation of concerns allows you to:
1. Host UI/UX on GitHub Pages (free and fast)
2. Process computationally intensive OCR on serverless backend
3. Maintain consistent API across different frontend versions
