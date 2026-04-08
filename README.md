# Class Generator

> AI-powered PowerPoint presentations for teachers, instantly.

Class Generator lets teachers type a lesson topic and instantly receive a professionally designed, 10-slide PowerPoint presentation — powered by OpenAI's GPT-4o. Guests get 3 free tries, signed-in teachers get 5 free generations per billing cycle, and subscribers get unlimited access.

---

## Screenshot

_Add screenshot here_

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth credentials — [console.cloud.google.com](https://console.cloud.google.com)
- OpenAI API key — [platform.openai.com](https://platform.openai.com)

---

## Setup

### 1. Clone and enter project

```bash
cd class-generator
```

### 2. Configure server environment

Copy and edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/classgenerator
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
ADMIN_SEED_EMAIL=admin@classgenerator.app
ADMIN_SEED_PASSWORD=Admin@1234
GUEST_FREE_LIMIT=3
TEACHER_FREE_LIMIT=5
GCASH_NUMBER=09XX-XXX-XXXX
GCASH_ACCOUNT_NAME=Your Name Here
MONTHLY_PRICE=299
THREE_MONTH_PRICE=799
```

### 3. Configure client environment

`client/.env` is pre-configured for local development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

### 4. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI
6. Copy the Client ID and Secret to `server/.env`

### 5. Start the backend

```bash
cd server
npm install
npm run seed      # Creates the admin account
npm run dev       # Starts the server on port 5000
```

### 6. Start the frontend

```bash
cd client
npm install
npm run dev       # Starts Vite on port 5173
```

---

## Default Admin Credentials

| Email | Password |
|-------|----------|
| admin@classgenerator.app | Admin@1234 |

Login at: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## Routes

### Guest (no account)
- `/` — Generator (3 free tries)

### Teacher (Google login)
- `/` — Generator (5 free tries per cycle)
- `/dashboard` — Generation history
- `/profile` — Account & subscription

### Admin (email/password)
- `/admin/login` — Admin login
- `/admin` — Dashboard with stats
- `/admin/users` — Manage teachers
- `/admin/users/:id` — Teacher detail
- `/admin/generations` — All generations
- `/admin/payments` — GCash payment confirmations

---

## GCash Payment Flow

1. Teacher uses all 5 free generations
2. Subscription modal shows GCash number and instructions
3. Teacher pays on their phone, clicks **"I've Paid — Notify Admin"**
4. Admin sees pending payment in dashboard
5. Admin clicks **Activate** and selects 1 or 3 months
6. Teacher's subscription is activated, quota reset to 0

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router v6 |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | Google OAuth 2.0 (teachers) + JWT (admin) |
| AI | OpenAI GPT-4o |
| PPTX | PptxGenJS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
