# LifePulse Vercel Deployment Guide

## Overview
LifePulse uses Vercel's serverless architecture for 24/7 deployment.

## Prerequisites
- Node.js installed
- Vercel CLI installed (`npm i -g vercel`)
- Google Gemini API key

## Local Development

### Option 1: Vercel Dev (Recommended)
```bash
npm run dev
```
This runs Vercel's local development server with serverless functions.

### Option 2: Local Express Server
```bash
npm run dev:local
```
This runs the local Express server (for backward compatibility only).

## Deployment to Vercel

### First Time Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**
   - Go to your Vercel project: https://vercel.com/dashboard
   - Settings > Environment Variables
   - Add: `GEMINI_API_KEY` = your actual API key

4. **Deploy**
   ```bash
   npm run deploy
   # OR
   vercel --prod
   ```

### Subsequent Deployments
```bash
git push
```
Vercel will automatically deploy on every push to your connected Git repository.

## Verifying Deployment

1. **Check Deployment Status**
   Visit your Vercel dashboard to see deployment logs

2. **Test AI Assistant**
   - Open your deployed website
   - Navigate to "Sanjeevani AI" section
   - Send a test message
   - Verify AI responds correctly

3. **Check Logs**
   ```bash
   vercel logs
   ```

## Troubleshooting

### Issue: "API Key Missing"
**Solution**: Add `GEMINI_API_KEY` to Vercel Environment Variables

### Issue: "404 Model Not Found"
**Solution**: Verify your Gemini API key has access to the Generative Language API
- Go to https://console.cloud.google.com/
- Enable "Generative Language API"

### Issue: "Module not found"
**Solution**: Ensure all dependencies are in `package.json`:
```bash
npm install
```

## Architecture

```
LifePulse
├── api/
│   └── chat.js          # Vercel Serverless Function (Production)
├── public/
│   ├── index.html       # Main website
│   ├── script.js        # Frontend logic
│   └── styles.css       # Styles
├── server/              # Local development only
│   └── index.js         # Express server (NOT used in production)
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies
```

## Important Notes

- **Production Backend**: Only `/api/chat.js` runs in production
- **Local Server**: `server/index.js` is for local testing only
- **No Build Step**: Static files served directly from `/public`
- **Environment Variables**: Must be set in Vercel dashboard
