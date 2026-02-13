# LifePulse Backend Server Setup Guide

## 🚀 Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

1. Create a `.env` file in the project root:
```bash
# Copy the example file
copy .env.example .env
```

2. Open `.env` and add your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANT**: Never commit the `.env` file to Git! It's already in `.gitignore`.

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `dotenv` - Environment variable management
- `@google/generative-ai` - Official Google Gemini SDK
- `cors` - Cross-origin resource sharing

### 4. Start the Server

```bash
npm start
```

You should see:
```
🚀 LifePulse Backend Server Started!
📍 Server running on: http://localhost:3000
🏥 AI Assistant: ✅ Configured
```

### 5. Open the Website

Open your browser and go to: **http://localhost:3000**

---

## 📁 Project Structure

```
LifePulse/
├── server/
│   ├── index.js              # Main server file
│   ├── config/
│   │   └── gemini.js         # Gemini AI configuration
│   ├── controllers/
│   │   └── chatController.js # Chat request handler
│   └── routes/
│       └── chat.js           # API route definitions
├── index.html                # Frontend website
├── script.js                 # Frontend JavaScript
├── styles.css                # Frontend styles
├── package.json              # Node.js configuration
├── .env                      # Environment variables (DO NOT COMMIT!)
├── .env.example              # Template for .env
└── .gitignore                # Files to ignore in Git
```

---

## 🔌 API Endpoints

### POST /api/chat
Send a health query and receive AI response.

**Request:**
```json
{
  "message": "I have fever and headache"
}
```

**Response:**
```json
{
  "reply": "Based on your symptoms...",
  "timestamp": "2026-02-13T16:07:59.000Z"
}
```

### GET /api/health
Check if the server is running properly.

**Response:**
```json
{
  "status": "healthy",
  "service": "LifePulse Backend",
  "timestamp": "2026-02-13T16:07:59.000Z",
  "geminiConfigured": true
}
```

---

## 🔧 Troubleshooting

### Error: "GEMINI_API_KEY is not set"
- Make sure you created the `.env` file
- Verify the API key is correctly pasted
- Restart the server after adding the key

### Error: "Port 3000 is already in use"
- Change the PORT in `.env` to a different number (e.g., 3001)
- Or stop the other application using port 3000

### Frontend can't connect to backend
- Make sure the server is running (check terminal)
- Verify you're accessing `http://localhost:3000`
- Check browser console for CORS errors

### AI responses are slow
- This is normal for first request (cold start)
- Subsequent requests should be faster
- Check your internet connection

---

## 🚢 Deployment (Production)

### Option 1: Render.com (Recommended - Free Tier Available)

1. Push your code to GitHub (make sure `.env` is in `.gitignore`!)
2. Go to [Render.com](https://render.com)
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Set environment variables in Render dashboard:
   - `GEMINI_API_KEY`: Your API key
   - `NODE_ENV`: production
6. Deploy!

### Option 2: Railway.app

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Add environment variables
5. Deploy

### Option 3: Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel`
3. Follow prompts and add environment variables

---

## 🔒 Security Checklist

- ✅ `.env` file is in `.gitignore`
- ✅ API key is never exposed in frontend code
- ✅ All API calls go through backend
- ✅ Input validation prevents abuse
- ✅ Error messages don't expose sensitive info

---

## 📞 Support

If you encounter issues:
1. Check that `.env` file exists and has correct API key
2. Verify all dependencies are installed (`npm install`)
3. Make sure port 3000 is not in use
4. Check console logs for detailed error messages

For more help, check the [Google AI Studio documentation](https://ai.google.dev/docs).
