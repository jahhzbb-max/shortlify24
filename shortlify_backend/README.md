# Shortlify Backend

Simple URL shortener backend (Node.js + Express + MongoDB) — ready to deploy.

## Quick start (local)
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. `npm start`
4. Health: `GET /health`
5. Create short url: `POST /api/shorten` JSON body: { "originalUrl": "https://example.com" }
6. Redirect: visit `/r/:shortId`

## Environment variables
- `MONGO_URL` : MongoDB connection string (mongodb+srv://user:pass@cluster/.../dbname)
- `BASE_URL`  : public base URL of backend (e.g. https://shortlify-backend.onrender.com)
- `FRONTEND_URL` : your frontend URL (e.g. https://shortlify24.netlify.app)
- `PORT` : optional (default 5000)

## Deploy
- Push this repo to GitHub (do NOT include .env)
- Create Render Web Service:
  - Start Command: `node server.js`
  - Add Environment Variables on Render: MONGO_URL, BASE_URL, FRONTEND_URL
