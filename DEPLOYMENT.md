# Production Deployment & Infrastructure Guide

This document details the production architecture, deployment strategy, and environment configuration for the AI-Powered Bookmark Manager.

---

## 🏗️ System Architecture

The application is architected as a decoupled full-stack system, optimized for scalability and containerization.

- **Frontend:** React (Vite) / Tailwind CSS
- **Backend:** Node.js / Express.js / Socket.io
- **Database:** MongoDB Atlas (NoSQL)
- **Caching:** Redis (Session management & Rate limiting)
- **AI Integration:** Google Gemini Pro
- **Security:** JWT Auth, OAuth 2.0, CORS, and Rate Limiting

---

## 🚀 Deployment Strategy

### 1. Cloud-Native Deployment (Recommended)

The project is configured for seamless CI/CD integration using modern cloud providers.

#### Backend (Render / Heroku)
- **Runtime:** Node.js LTS
- **Build Command:** `npm install`
- **Infrastructure:** Deployed as a Web Service with auto-scaling capabilities.
- **Environment Management:** Secured via encrypted environment variables.

#### Frontend (Vercel / Netlify)
- **Runtime:** Edge Network / Static Hosting
- **Build Command:** `npm run build`
- **Routing:** Configured for Single Page Application (SPA) fallbacks.

### 2. Containerized Deployment (Docker)

For local development or self-hosted production environments, the project includes a multi-container Docker configuration.

```bash
# To spin up the entire stack (Backend, Frontend, Redis)
docker-compose up --build
```

---

## 🔐 Environment Configuration

Production stability and security are managed through strictly defined environment variables.

### Backend Requirements
| Key | Description |
| :--- | :--- |
| `MONGO_URI` | Production MongoDB connection string |
| `GEMINI_API_KEY` | Google AI API credentials |
| `JWT_SECRET` | HS256 Signing Key for secure sessions |
| `FRONTEND_URL` | CORS whitelist for the production frontend |

### Frontend Requirements
| Key | Description |
| :--- | :--- |
| `VITE_API_URL` | Base endpoint for the production API |
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 credentials for secure login |

---

## 🛠️ Security & Operational Best Practices

- **CORS Configuration:** The API implements strict Cross-Origin Resource Sharing (CORS) policies to ensure only authorized clients (Frontend & Extension) can access resources.
- **Secrets Management:** Sensitive keys are never committed to version control; they are managed through provider-specific secret vaults.
- **Automated CI/CD:** Push-to-deploy workflows are configured for automatic staging and production builds upon merging to the `main` branch.
- **Error Monitoring:** Structured logging is implemented to track system health and AI service performance in production environments.

---

## 🧩 Extension Distribution

The browser extension is configured to point to the production API. The production bundle is automatically generated and hosted as a static asset within the frontend build, ensuring users always download the correctly configured version for the live environment.
