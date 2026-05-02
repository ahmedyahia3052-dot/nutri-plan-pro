# Nutri Plan Pro v2

A production-ready clinical nutrition and food safety platform. Runs fully locally with Node.js and PostgreSQL — npm only, no pnpm, no workspace dependencies.

---

## Features

- **Authentication** — Email/password registration and login with JWT sessions (bcryptjs)
- **Health Profile** — Age, weight, height, activity level, goal, conditions, allergies, medications
- **AI Diet Plans** — Rule-based personalized daily and weekly meal plans (diabetes, hypertension, heart disease, kidney disease, obesity, general health)
- **Drug-Food Interactions** — 25 interactions across 15 common medications with severity ratings (minor / moderate / major)
- **Daily Tracking** — Log meals by type, track macros, and monitor water intake with a 7-day calorie trend chart
- **Calorie Calculator** — Mifflin-St Jeor BMR/TDEE with BMI and macro breakdown
- **Nutrition Articles** — Evidence-based articles on macronutrients, micronutrients, and healthy eating
- **Food Safety** — HACCP principles, cross-contamination, storage guidelines, allergen control
- **In-App Notifications** — Automatic reminders for profile setup, drug interactions, hydration, and meal logging
- **Dashboard Charts** — Calorie ring, macro bar chart, 7-day area trend (Recharts)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TanStack Query v5 |
| Styling | Tailwind CSS v3, Radix UI primitives |
| Charts | Recharts 2 |
| Backend | Express 4, TypeScript via tsx |
| Database | PostgreSQL + Drizzle ORM |
| Auth | jsonwebtoken + bcryptjs |

---

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- PostgreSQL 14 or later running locally

### 1. Install dependencies

```bash
cd nutri-plan-pro-standalone
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nutri_plan_pro
JWT_SECRET=paste_a_long_random_string_here
PORT=3001
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE nutri_plan_pro;
```

### 4. Push the schema

```bash
npm run db:push
```

### 5. Seed reference data

```bash
npm run db:seed
```

Seeds 15 medications, 25 food-drug interactions, 8 food safety articles, and 8 nutrition articles.

### 6. Start the app

```bash
npm run dev
```

Open **http://localhost:5173** — register an account and start using the app.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start client (port 5173) + server (port 3001) concurrently |
| `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Express API server only |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:seed` | Seed reference data |

---

## First Use

1. Open **http://localhost:5173**
2. Click **Create one free** to register your account
3. Go to **My Profile** and complete your health information
4. Go to **Diet Plans** to generate your first personalized meal plan
5. Use **Daily Tracker** to log meals and water intake

---

## Project Structure

```
nutri-plan-pro-standalone/
├── src/
│   ├── api/hooks.ts              # All TanStack Query hooks + apiFetch (JWT-aware)
│   ├── context/
│   │   ├── AuthContext.tsx       # JWT auth state (localStorage)
│   │   └── NotificationContext.tsx
│   ├── components/
│   │   ├── Layout.tsx            # Sidebar + user menu + notification bell
│   │   ├── NotificationBell.tsx  # In-app notification dropdown
│   │   └── ui/                   # Button, Input, Dialog, Toast, etc.
│   └── pages/
│       ├── Login.tsx
│       ├── Register.tsx
│       ├── Dashboard.tsx         # Charts: calorie ring, macros, 7-day trend
│       ├── Profile.tsx
│       ├── DietPlans.tsx
│       ├── DietPlanDetail.tsx    # Daily + weekly meal view
│       ├── DailyTracker.tsx      # Food log + water tracker + charts
│       ├── CalorieCalculator.tsx
│       ├── Interactions.tsx
│       ├── Nutrition.tsx
│       └── FoodSafety.tsx
├── server/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (users, profiles, diet_plans, daily_logs, water_logs, ...)
│   │   ├── index.ts              # DB pool connection
│   │   └── seed.ts               # Reference data seeder
│   ├── middleware/
│   │   └── auth.ts               # requireAuth / optionalAuth / signToken
│   └── routes/
│       ├── auth.ts               # POST /auth/register, /auth/login, GET /auth/me
│       ├── profile.ts            # GET/POST /profile (user-scoped)
│       ├── dietplans.ts          # CRUD /diet-plans (user-scoped, weekly plans)
│       ├── tracking.ts           # GET/POST /tracking/food, /tracking/water, /tracking/weekly
│       ├── dashboard.ts          # GET /dashboard/summary (with today's stats)
│       ├── interactions.ts       # GET /interactions, /reference/medications
│       ├── foodsafety.ts         # GET /food-safety
│       ├── nutrition.ts          # GET /nutrition/info, POST /nutrition/calorie-calculator
│       └── reference.ts          # GET /reference/conditions, /reference/allergies
├── .env.example
├── drizzle.config.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Notes

- All user-specific data (profiles, diet plans, logs) is scoped per account
- Multiple users can share the same instance
- Drug interaction data and nutrition information are for educational purposes only
- Not a substitute for professional medical, nutritional, or pharmaceutical advice
