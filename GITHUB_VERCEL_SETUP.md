# Setting Up GitHub and Vercel Integration

This guide explains how to set up the required secrets and configuration for deploying your application with:
- Frontend hosted on GitHub Pages (app.bytsea.com)
- Backend API hosted on Vercel

## Required Secrets

You need to add the following secrets to your GitHub repository for the workflows to function properly:

### 1. Vercel Deployment Secrets

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `VERCEL_TOKEN` | API token for Vercel | Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Your Vercel organization ID | See instructions below |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | See instructions below |
| `GH_PAT` | GitHub Personal Access Token | Settings → Developer settings → Personal access tokens |

## How to Obtain Vercel Credentials

### Vercel Token
1. Go to [Vercel Settings](https://vercel.com/account/tokens)
2. Click "Create" to generate a new token
3. Give it a name like "GitHub Actions Deployment"
4. Copy the token and add it to your GitHub repository secrets

### Vercel Organization ID and Project ID
Run this command after installing Vercel CLI and linking your project:

```bash
vercel link
# Follow the prompts to link your project

# Then run this to see the project info:
vercel project ls
```

The JSON output will contain both your organization ID and project ID.

Alternatively, you can find these in your Vercel project settings or by inspecting the `.vercel` directory after running `vercel link`.

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the required secrets

## Setting Up GitHub Variables

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click on the "Variables" tab
4. Create a variable named `OCR_API_URL` with a temporary value (this will be updated by the workflow)

## Deployment Process

With these secrets configured:

1. When changes are made to backend files (`api/*`, `ocr_parser/*`, etc.), the backend workflow will:
   - Deploy the changes to Vercel
   - Update the `OCR_API_URL` GitHub variable with the new deployment URL

2. When changes are made to frontend files, the frontend workflow will:
   - Build the application using the Vercel URL from the `OCR_API_URL` variable
   - Deploy to GitHub Pages

This ensures the frontend always has the correct backend URL.

## Manual Deployment

If needed, you can manually trigger deployments using the "Run workflow" button in the GitHub Actions tab.

## Troubleshooting

If the OCR Backend shows as "Service Unavailable":
1. Check that the `OCR_API_URL` GitHub variable is set to your correct Vercel URL
2. Trigger a frontend redeploy to use the updated URL
