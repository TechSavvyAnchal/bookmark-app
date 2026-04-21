# 🚀 Deployment Guide: AI-Powered Bookmark Manager

This document outlines the steps to move this project from a local development environment to a production-ready cloud environment.

---

## 🏗️ Architecture Overview
- **Frontend:** React (Vite) deployed on **Vercel**.
- **Backend:** Node.js (Express) deployed on **Render**.
- **Database:** MongoDB Atlas (Cloud).
- **Cache/Socket:** Redis (optional/integrated).

---

## 1. Backend Deployment (Render)
1. **Repository:** Ensure your code is pushed to GitHub.
2. **New Web Service:** Create a new "Web Service" on [Render.com](https://render.com).
3. **Configuration:**
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment Variables:** In the "Env Vars" tab, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google AI API key.
   - `JWT_SECRET`: A long random string.
   - `PORT`: `5000`
   - `EMAIL_USER` / `EMAIL_PASS`: (For cron job summaries).
   - `FRONTEND_URL`: Your final Vercel URL (e.g., `https://your-app.vercel.app`).
5. **Database Access:** In MongoDB Atlas, go to **Network Access** and "Allow Access from Anywhere" (`0.0.0.0/0`) so Render can connect.

---

## 2. Frontend Deployment (Vercel)
1. **New Project:** Import your GitHub repository into [Vercel](https://vercel.com).
2. **Configuration:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
3. **Environment Variables:**
   - `VITE_API_URL`: Your **Render Web Service URL** (e.g., `https://ai-bookmarks-api.onrender.com`).
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
4. **Deploy:** Hit deploy. Vercel will provide you with a production URL.

---

## 3. Google OAuth Configuration (Required)
Your Google Login will only work if the production URL is authorized.
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript Origins**, add:
   - `https://your-app.vercel.app`
4. Under **Authorized Redirect URIs**, add:
   - `https://your-app.vercel.app`
5. **Save** and wait ~5 minutes for changes to propagate.

---

## 4. Browser Extension & Bookmarklet
Once the backend is deployed, you must update the "Saver" tools:
1. **Update Extension:** Open `browser-extension/popup.js` and change `CONFIG.API_URL` to your live Render URL.
2. **Update ZIP:** Re-zip the extension folder and place it in `frontend/public/extension-bundle.zip`.
3. **Redeploy Frontend:** Push these changes to GitHub so the "Download Extension" button provides the production-ready version.

---

## 💡 Interview Tip
When asked about deployment, mention that you used **Environment Variables** to keep secrets secure and configured **CORS (Cross-Origin Resource Sharing)** on the backend to allow the Frontend, Extension, and Bookmarklet to communicate securely across different domains.
