# Deploying OCR Parser Backend to Vercel

This guide covers how to deploy the OCR parser backend to Vercel and connect your frontend to it.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. The Vercel CLI (optional, for local testing)

## Deployment Steps

### 1. Push your code to GitHub

Make sure your code is pushed to a GitHub repository for easy deployment.

### 2. Create a new Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project settings:
   - Framework Preset: Other
   - Build Command: None (leave blank)
   - Output Directory: None (leave blank)
   - Install Command: `pip install -r requirements.txt`

### 3. Set environment variables

In the Vercel project settings, add these environment variables:

- `PYTHONPATH`: `.`
- `VERCEL_DEPLOYMENT`: `true`

### 4. Configure Python version

Ensure you're using Python 3.12 in your Vercel project settings. This project is optimized for Python 3.12.

### 5. Deploy

Click "Deploy" and wait for the deployment to complete.

### 6. Update frontend configuration

Once deployed, update the `OCR_API_BASE_URL` in `services/config.ts` with your Vercel deployment URL:

```typescript
export const OCR_API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-vercel-deployment-url.vercel.app' // Update with your actual Vercel URL
  : 'http://localhost:3000';
```

## API Endpoints

The backend provides these endpoints:

- `GET /api/health` - Check if the backend is up and running, provides detailed information about the environment
- `POST /api/parse` - Process and parse a document

- `POST /api/parse` - Process and parse a document with OCR and return structured data

## Implementation Details

### Caching System

The OCR processing backend includes an efficient caching system to reduce redundant processing:

- Uses file-based caching in the `/tmp` directory (Vercel's writable storage)
- Cache entries expire after 1 day (configurable in `FileCache` class)
- Automatic cache cleanup to stay under Vercel's storage limits
- File hashing to identify identical documents

### Rate Limiting

To stay within Vercel's free tier limits, the backend implements a token bucket algorithm:

- 30 tokens per minute rate limit (configurable)
- Each page processed costs 5 tokens
- Maximum 60 tokens can be accumulated (for processing bursts)
- 429 responses include `Retry-After` header for client retries

### Error Handling & Monitoring

- Detailed logging for debugging
- CORS headers for cross-origin requests from GitHub Pages
- Structured error responses
- Health endpoint with detailed environment information

## Vercel Free Tier Limitations

- **File Size**: 5MB maximum request body size
- **Memory**: 2GB maximum for Hobby plan
- **Execution Time**: 60 seconds maximum (configured in `vercel.json`)
- **Cold Starts**: First request after inactivity may take longer
- **Storage**: Limited `/tmp` directory size (managed by cache cleanup)

## Testing & Troubleshooting

### Verifying Deployment

After deployment, visit your `/api/health` endpoint to verify:
- Tesseract availability
- Region information
- Cache status
- Rate limiter configuration

### Common Issues

1. **Deployment Failures**:
   - Check Vercel deployment logs
   - Verify all dependencies are in `requirements.txt`
   - Ensure Python 3.12 is selected

2. **Runtime Errors**:
   - Check function logs in Vercel dashboard
   - Verify Tesseract installation via health endpoint
   - Check temporary storage permissions

3. **CORS Issues**:
   - The API includes CORS headers for cross-origin requests
   - Verify frontend is using the correct backend URL

4. **Rate Limiting**:
   - When rate limited, the API returns 429 with a `Retry-After` header
   - Adjust rate limits in `rate_limit.py` if needed

### Local Development

For local testing with Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This simulates the Vercel environment locally for debugging.
