### Deploy to Render (Step-by-step)

This repo contains two apps: `Inventory_Server` (API) and `Inventory_Client` (Next.js). You will create two Render Web Services.

1) Prerequisites
- Render account and GitHub repo access
- MongoDB connection string (MongoDB Atlas recommended)

2) Required environment variables
- API (Inventory_Server):
  - DATABASE_URI: your MongoDB URI
  - JWT_SECRET: a long random string
  - JWT_EXPIRES_IN: e.g. 7d
  - JWT_REFRESH_EXPIRES_IN: e.g. 30d
  - ALLOWED_HOSTS: JSON array of allowed origins, e.g. ["https://your-client.onrender.com"] (you can start with "*" and tighten later)
  - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM (optional, for password reset emails)
- Client (Inventory_Client):
  - NEXT_PUBLIC_API_BASE_URL: API base including /api (e.g. https://your-api.onrender.com/api)

3) Deploy API service
- In Render: New → Web Service → select this repo
- Advanced → Root Directory: Inventory_Server
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Add env vars from step 2
- Create the service and note its URL, e.g. https://your-api.onrender.com
- Health check: GET https://your-api.onrender.com/ should return "Live"

4) Configure CORS/WebSocket origins
- Set ALLOWED_HOSTS on the API to the client origin, e.g. ["https://your-client.onrender.com"]
- Socket.IO uses the same origin setting

5) Deploy Client service
- In Render: New → Web Service → select this repo
- Advanced → Root Directory: Inventory_Client
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Env var: NEXT_PUBLIC_API_BASE_URL = https://your-api.onrender.com/api
- Create the service and open the client URL

6) Verify end-to-end
- Client loads and API requests go to NEXT_PUBLIC_API_BASE_URL
- WebSocket connects (derived from API base without /api)
- If CORS/WebSocket fails, re-check ALLOWED_HOSTS and the client origin

7) Optional: render.yaml blueprint
You can automate both services with a blueprint file at repo root:

```yaml
services:
  - type: web
    name: inventory-api
    rootDir: Inventory_Server
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URI
        sync: false
      - key: ALLOWED_HOSTS
        value: "[\"https://your-client.onrender.com\"]"
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: JWT_REFRESH_EXPIRES_IN
        value: 30d

  - type: web
    name: inventory-client
    rootDir: Inventory_Client
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://inventory-api.onrender.com/api
```

8) Local dev parity
- API: `cd Inventory_Server && npm i && npm run dev`
- Client: `cd Inventory_Client && npm i && npm run dev` with `.env.local` → `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`