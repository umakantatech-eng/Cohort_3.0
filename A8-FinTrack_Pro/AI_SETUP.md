# AI Integration Setup Guide

FinTrack Pro uses Google Gemini AI to provide personalized financial insights based on your transaction history.

## 1. Obtain a Gemini API Key

1. Go to Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. Click on **"Get API key"** in the left sidebar.
4. Click **"Create API key in new project"** (or use an existing project).
5. Copy the generated API key. Keep this key secure!

## 2. Environment Variable Setup

To run the AI assistant locally, you need to configure your environment variables.

1. Open the `.env` file in the root of your project. If you don't have one, copy `.env.example` to `.env`.
2. Add the following line to your `.env` file, replacing `YOUR_API_KEY_HERE` with the key you just copied:

```env
VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
```

3. Restart your Vite development server (`npm run dev`) for the changes to take effect.

## 3. Vercel Deployment Instructions

Since we are using Vite, environment variables must be exposed to the client build process. Vercel makes this very simple.

1. Go to your project dashboard on [Vercel](https://vercel.com/).
2. Navigate to **Settings > Environment Variables**.
3. Add a new variable:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** (paste your Gemini API key here)
   - **Environments:** Select Production, Preview, and Development.
4. Click **Save**.
5. Go to the **Deployments** tab and trigger a new deployment (or just push your code to your GitHub `production` branch, which will trigger Vercel automatically).
6. Once deployed, the AI Assistant button will appear in the bottom right corner of the dashboard!

> **Note on Security:** Since this is a client-side Vite application, variables prefixed with `VITE_` are exposed in the build. For enterprise applications, it is recommended to move the Gemini API call to a Vercel Serverless Function (e.g., `api/gemini.js`) instead of calling it directly from the client.
