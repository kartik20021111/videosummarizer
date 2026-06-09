# VideoSummarizer

VideoSummarizer is a production-ready web application that takes a YouTube video URL and generates a concise, accurate bulleted summary using AI. It uses the YouTube Data API to fetch captions and the Groq API (Llama 3.3 70B) to generate the summaries.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **APIs**: YouTube Data API v3, Groq API
- **Deployment**: Firebase Hosting & Functions

## Prerequisites
- Node.js (v18+)
- Firebase CLI (for deployment)

## How to Get API Keys

### YouTube Data API v3 Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library**.
4. Search for "YouTube Data API v3" and enable it.
5. Go to **APIs & Services > Credentials**.
6. Click **Create Credentials > API Key**.
7. Copy your API Key.

### Groq API Key
1. Go to the [Groq Console](https://console.groq.com/).
2. Sign up or log in (no credit card required).
3. Go to the **API Keys** section.
4. Click **Create API Key**.
5. Copy your API Key.

## Setup & Run Locally

1. Install dependencies for the root, client, and server:
   ```bash
   npm run install:all
   ```

2. Create a `.env` file in the `server` directory and add your API keys:
   ```bash
   cd server
   copy .env.example .env
   # Edit .env with your YOUTUBE_API_KEY and GROQ_API_KEY
   ```

3. Start the application (both client and server concurrently):
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8080`.

## Deploy to Firebase

1. Log in to Firebase:
   ```bash
   firebase login
   ```
2. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```
   Select Hosting and Functions. Choose your Firebase project. Set public directory to `client/dist`. Do not rewrite all URLs to `/index.html` (the firebase.json handles it).

3. Build the frontend and deploy:
   ```bash
   npm run build:client
   firebase deploy
   ```

## Known Limitations
- **Only YouTube Videos**: Currently, only YouTube URLs are supported.
- **Captions Required**: The video must have captions available (either auto-generated or manually uploaded) for the AI to summarize it. Videos without captions will return an error.
