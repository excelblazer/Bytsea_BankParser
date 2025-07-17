# Deployment Scripts Reference

This document describes the deployment scripts available for the Bytsea Bank Parser project.

## Available Scripts

### 1. `validate-separation.sh`
**Purpose**: Validates that the project is properly configured for separated frontend/backend deployment.

**Usage**:
```bash
./validate-separation.sh
```

**What it checks**:
- ✅ Backend components (API files, OCR parser modules)
- ✅ Frontend components (React app, components, services)
- ✅ Configuration files (vercel.json, package.json)
- ✅ Service configuration (frontend-backend connectivity)

### 2. `deploy-backend-only.sh`
**Purpose**: Deploys only the backend (API + OCR parser) to Vercel.

**Prerequisites**:
- Set `VERCEL_TOKEN` environment variable
- Vercel CLI installed (script will install if missing)

**Usage**:
```bash
# Preview deployment
./deploy-backend-only.sh

# Production deployment
./deploy-backend-only.sh --production
```

**What it does**:
1. Creates temporary deployment directory
2. Copies only backend files (api/, ocr_parser/, requirements.txt, vercel.json)
3. Deploys to Vercel using CLI
4. Cleans up temporary files

### 3. `deploy-gh.js`
**Purpose**: Builds and prepares frontend for GitHub Pages deployment.

**Usage**:
```bash
node deploy-gh.js
# or
npm run deploy:frontend
```

**What it does**:
1. Builds React app for production
2. Creates `.nojekyll` file for GitHub Pages
3. Creates `404.html` for SPA routing
4. Copies CNAME file if exists

### 4. `test-deploy-scripts.sh`
**Purpose**: Tests deployment scripts without actually deploying.

**Usage**:
```bash
./test-deploy-scripts.sh
```

## NPM Scripts

The following scripts are available via `npm run`:

- `npm run validate` → Runs `validate-separation.sh`
- `npm run deploy:backend` → Runs `deploy-backend-only.sh`
- `npm run deploy:frontend` → Runs `deploy-gh.js`

## GitHub Actions Workflow

The project includes `deploy-combined.yml` workflow that:

1. **Backend Deployment**:
   - Deploys backend to Vercel
   - Tests health endpoint
   - Outputs backend URL for frontend

2. **Frontend Security Audit**:
   - Runs npm audit
   - Performs type checking

3. **Frontend Deployment**:
   - Builds frontend with backend URL
   - Verifies build security
   - Deploys to GitHub Pages

## Required Secrets

For GitHub Actions, set these repository secrets:

- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID  
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Environment Variables

Create `.env.local` for development:
```bash
VITE_OCR_API_URL=http://localhost:8000
```

For production, the frontend will use the deployed Vercel backend URL.

## File Structure for Deployment

### Backend (Vercel):
```
api/
├── health.py
└── parse.py
ocr_parser/
├── __init__.py
├── ocr.py
├── parser.py
├── preprocessing.py
├── cache.py
└── rate_limit.py
requirements.txt
vercel.json
```

### Frontend (GitHub Pages):
```
components/
services/
public/
index.html
App.tsx
package.json
```

## Troubleshooting

1. **Backend deployment fails**: Check `VERCEL_TOKEN` is set
2. **Frontend can't connect**: Verify backend URL in `services/config.ts`
3. **CORS errors**: Check `vercel.json` headers configuration
4. **Import errors**: Ensure `ocr_parser/__init__.py` exists

## Testing

Before deployment, always run:
```bash
./validate-separation.sh
./test-deploy-scripts.sh
```
