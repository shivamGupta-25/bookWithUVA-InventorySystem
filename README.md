# Book with UVA - Inventory Management System

A full‑stack inventory management system with a Next.js client and an Express/MongoDB server. This README consolidates setup, scripts, environment, and feature docs for both apps.

## Monorepo Structure

```
bookWithUVA-InventorySystem/
├─ Inventory_Client/      # Next.js 15 app (React 19, Tailwind CSS)
└─ Inventory_Server/      # Express + Mongoose API (TypeScript runtime via tsx)
```

## Quick Start

- Server: port 4000 (configurable via `PORT`) → `http://localhost:4000`
- Client: port 3000 (Next default) → `http://localhost:3000`

### 1) Server (API)

- Directory: `Inventory_Server`
- Tech: Express 5, Mongoose 8, JWT auth, Helmet, CORS, Nodemailer
- Entry: `index.ts`
- Routes mounted at `/api` in `api_routes.ts`

#### Install & Run

```bash
cd Inventory_Server
npm install
npm run dev
```

#### Environment (.env in Inventory_Server)

```env
# Core
DATABASE_URI=mongodb://localhost:27017/bookwithuva-inventory
PORT=4000
ALLOWED_HOSTS=["http://localhost:3000"]

# Auth
JWT_SECRET=change-me-in-prod
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (forgot password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

Scripts:
- `npm run dev` — start API with tsx watch
- `npm run seed` — seed sample data (`script/seedData.js`)
- `npm run create-admin` — create default admin (`script/createAdmin.js`)

Base endpoints:
- Health: `GET /` → "Live"
- API: under `/api` (see Auth, Users, Products, Distributors, Orders, Activity Logs below)

### 2) Client (Web)

- Directory: `Inventory_Client`
- Tech: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, Radix UI, Recharts
- Auth context: `src/contexts/AuthContext.jsx`
- API helper: `src/lib/api.js` (base `http://localhost:4000/api`)

#### Install & Run

```bash
cd Inventory_Client
npm install
npm run dev
```

Optional `.env.local` (if you want to override):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Scripts:
- `npm run dev` — Next dev server
- `npm run build` — Next production build
- `npm start` — Next start

## Authentication & Authorization

- JWT access/refresh tokens (stored in cookies on client)
- Roles: `admin`, `manager`, `viewer`
- Client verifies/refreshes tokens via:
  - `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
  - `GET/PUT /api/auth/profile`, `PUT /api/auth/change-password`, `GET /api/auth/verify`
- Protected server routes use middleware in `utils/authUtils.ts` with role checks
- Client‑side protection via `ProtectedRoute` and `AuthProvider`

## API Overview (mounted at /api)

Auth
- POST `/auth/login`
- POST `/auth/logout` (requires auth)
- POST `/auth/refresh`
- GET `/auth/profile` (requires auth)
- PUT `/auth/profile` (requires auth)
- PUT `/auth/change-password` (requires auth)
- GET `/auth/verify` (requires auth)
- POST `/auth/forgot-password`
- POST `/auth/reset-password`

Users (Admin only)
- POST `/users`
- GET `/users`
- GET `/users/stats`
- GET `/users/:id`
- PUT `/users/:id`
- DELETE `/users/:id`
- PUT `/users/:id/toggle-status`

Activity Logs (Admin only)
- GET `/activity-logs`
- GET `/activity-logs/stats`
- GET `/activity-logs/:id`
- GET `/users/:userId/activity-logs`
- DELETE `/activity-logs/cleanup`

Products
- GET `/products`
- POST `/products` (Admin/Manager)
- DELETE `/products` (Admin)
- GET `/product/:id`
- PUT `/product/:id` (Admin/Manager)
- DELETE `/product/:id` (Admin/Manager)
- GET `/products/stats`

Distributors
- GET `/distributors`
- POST `/distributors` (Admin/Manager)
- PUT `/distributor/:id` (Admin/Manager)
- DELETE `/distributor/:id` (Admin/Manager)
- DELETE `/distributors` (Admin)

Orders
- GET `/orders`
- GET `/order/:id`
- POST `/orders` (Admin/Manager)
- PUT `/order/:id` (Admin/Manager)
- DELETE `/order/:id` (Admin/Manager)
- DELETE `/orders` (Admin)
- GET `/orders/stats`

## Forgot Password (OTP Email)

- Configure email env vars (see server env above)
- Client pages: `/forgot-password`, `/reset-password`
- Server adds OTP fields to `user` model and validates expiry/usage

## Notable Client Paths

- `src/app/_components/Dashboard.jsx` — main dashboard
- `src/components/ProtectedRoute.jsx` — gate UI by auth/role
- `src/contexts/AuthContext.jsx` — login, refresh, profile, role helpers
- `src/lib/api.js` — typed-ish fetch wrappers

## Notable Server Paths

- `index.ts` — server boot, CORS/Helmet, Mongo connect
- `api_routes.ts` — route wiring and RBAC + activity logging
- `controllers/*` — business logic per module
- `models/*` — Mongoose schemas
- `utils/authUtils.ts` — auth middlewares, `logActivity`
- `utils/emailService.ts` — nodemailer integration
- `script/*` — seeding and admin creation

## Development Tips

- Ensure MongoDB is running and `DATABASE_URI` points to it
- Keep `ALLOWED_HOSTS` aligned with client origin(s)
- Default admin is created via `npm run create-admin`; change the password immediately in production

## License

MIT