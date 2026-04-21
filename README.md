# 🚀 AI-Powered Bookmark Manager

A full-stack application that leverages AI to transform how you save and interact with the web. Automatically summarize articles, generate quizzes, and chat with your entire bookmark collection.

## ✨ Core Features

-   **AI Smart Analysis:** Uses Google Gemini (2.0 Flash) to automatically generate summaries, categories, and tags.
-   **Interactive AI Chat:** A built-in assistant to query your bookmarks or get recommendations from your saved content.
-   **Comprehension Quizzes:** Automatically generates quizzes from articles to help you retain what you read.
-   **Browser Extension & Bookmarklet:** Two powerful ways to save content instantly without leaving your current tab.
-   **Reader Mode:** A clean, distraction-free reading experience for saved articles.
-   **Collaborative Vaults:** Create shared folders for bookmarks with friends or teammates.
-   **Smart Analytics:** Track your reading habits and interest distribution over time.

## 🛠️ Tech Stack

-   **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
-   **Backend:** Node.js, Express, MongoDB (Mongoose), Redis (Caching)
-   **AI Engine:** Google Gemini AI
-   **Utilities:** Readability.js, Turndown, Nodemailer

## 📦 Local Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis (Optional for local, recommended for production)

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env based on .env.example
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Configure .env (Set VITE_API_URL to http://localhost:5000)
npm run dev
```

## 🔒 Essential Environment Variables

### Backend (`/backend/.env`)
- `MONGO_URI`: MongoDB connection string.
- `GEMINI_API_KEY`: Google Generative AI API Key.
- `JWT_SECRET`: Random string for secure authentication.
- `GOOGLE_CLIENT_ID`: Required for Google Login.
- `RECAPTCHA_SECRET_KEY`: For security verification.

### Frontend (`/frontend/.env`)
- `VITE_API_URL`: URL of your backend (Default: `http://localhost:5000`).
- `VITE_GOOGLE_CLIENT_ID`: Must match the backend client ID.

## 🚢 Deployment
For detailed production deployment steps on **Render** and **Vercel**, please refer to the [**DEPLOYMENT.md**](./DEPLOYMENT.md) guide.

## 🧩 Browser Tools
This project includes a professional-grade browser extension and a one-click bookmarklet.
1. Visit the **Extension Guide** page within the app to get your personal Access Token.
2. Download the extension bundle directly from the app.
3. Drag the Bookmarklet to your bookmarks bar for instant, zero-install saving.

---
*Developed as a high-performance portfolio project demonstrating Full-Stack expertise and AI integration.*
