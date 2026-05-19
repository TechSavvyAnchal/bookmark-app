# 🚀 AI Bookmark Manager

I built this project because I have a "tab hoarding" problem—saving hundreds of bookmarks but never actually reading them. This app doesn't just store links; it uses AI to help me actually process and remember the content I save.

## 💡 Why I Built This

Most bookmark managers are just lists of URLs. I wanted something that could:
1. **Summarize** long articles instantly so I know if they're worth my time.
2. **Quiz me** on what I read to make sure I actually understood it.
3. **Chat** with my bookmarks so I can find specific info across dozens of saved pages without searching manually.

## 🛠️ The Tech Stack (and why I chose it)

-   **Frontend:** **React** with **Tailwind CSS**. I used **Framer Motion** for smooth UI transitions because I wanted the app to feel "alive" and modern.
-   **Backend:** **Node.js** & **Express**. It's lightweight and handles the asynchronous AI calls perfectly.
-   **Database:** **MongoDB** for the flexible schema (bookmarks can have very different metadata).
-   **AI:** **Google Gemini 1.5 Flash**. I chose this for its speed and massive context window, which is great for analyzing long research papers or articles.
-   **Caching:** **Redis**. AI calls can be slow/expensive, so I cache summaries and analytics to keep the UX snappy.

## 🧠 Technical Challenges I Solved

-   **Web Scraping & Noise Reduction:** Most websites are full of ads and navbars. I integrated `Readability.js` to strip out the "noise" before sending the text to Gemini, which significantly improved summary quality and reduced API costs.
-   **The "Saver" Problem:** I realized I wouldn't use the app if I had to manually copy-paste links. I built a **Chrome Extension** and a **Javascript Bookmarklet** so I can save any page in one click.
-   **Real-time Retention:** I built a custom Quiz engine that takes the AI's analysis and generates multiple-choice questions on the fly. It’s been the best feature for actually learning from my bookmarks.

## 📦 How to Run It Locally

### 1. Backend
```bash
cd backend
npm install
npm start
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🚢 Deployment & Infrastructure
I've documented the production setup (Vercel, Render, and Docker) in [**DEPLOYMENT.md**](./DEPLOYMENT.md).

---

