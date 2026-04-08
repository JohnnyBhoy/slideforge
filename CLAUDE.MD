You are a senior full-stack TypeScript developer. Your job is to build
"SlideForge" from scratch — a web app where teachers enter a topic
and receive a generated PowerPoint presentation they can download.
Guests get 3 free tries (persisted across refreshes), Google-authenticated
teachers get 5 tries per billing cycle, and after that they must subscribe
via GCash monthly. There is also an Admin dashboard to manage users and
subscriptions.

Read this entire file before writing a single line of code.
Follow every instruction in order. Do not skip any step.

---

## OVERVIEW

Class Generator has three account types:

1. Guest (no account)
   - Can use the generator up to 3 times total
   - Try count is stored in the database tied to a browser fingerprint
     (use a UUID stored in localStorage key cg_guest_id AND also
     persisted server-side so refreshing does NOT reset the count)
   - After 3 tries, a modal appears prompting them to Sign in with Google
   - Cannot access any other pages

2. Teacher Account
   - Signs in with Google only (no manual registration)
   - After login, gets 5 free generations per billing cycle
   - After 5 tries, a modal appears prompting them to subscribe via GCash
   - Can view their generation history (topic + download link)
   - Can download previously generated presentations
   - Can update their profile (name, avatar)
   - Has a subscription status badge on their profile

3. App Admin Account
   - Logs in with email and password (no Google)
   - Full dashboard to manage the application
   - Can view all registered teachers and their details
   - Can activate or deactivate teacher accounts
   - Can manually grant or reset a teacher's generation quota
   - Can mark a teacher as "subscribed" after GCash payment confirmation
   - Can view total stats: users, total generations, active subscribers
   - Can view any teacher's generation history
   - Cannot use the generator

---

## TECH STACK

- Frontend: React 18, TypeScript, Vite, TailwindCSS, React Router v6
- Backend: Node.js, Express.js, TypeScript
- Database: MongoDB with Mongoose
- Auth: Google OAuth 2.0 (teachers) + JWT email/password (admin)
- PPTX Generation: PptxGenJS (server-side via Node.js)
- AI: OpenAI API using gpt-4o to generate slide content from topic
- Forms: React Hook Form + Zod validation
- Notifications: React Toastify
- HTTP: Axios with interceptors
- File Storage: Generated PPTX files saved to /server/public/generated/
  and served statically

---

## PROJECT STRUCTURE

Create this exact folder layout before writing any code:

```
class-generator/
├── client/                        # React TypeScript frontend
│   └── src/
│       ├── api/                   # All Axios API call functions
│       ├── components/
│       │   ├── common/            # Navbar, Loader, ProtectedRoute, Modal
│       │   ├── generator/         # TopicForm, SlidePreview, DownloadCard
│       │   └── admin/             # Admin dashboard components
│       ├── context/               # AuthContext, GeneratorContext
│       ├── hooks/                 # useGenerator, useAuth, useGuest
│       ├── pages/
│       │   ├── LandingPage/       # Main generator page (public)
│       │   ├── OAuthSuccess/      # Google OAuth redirect handler
│       │   ├── DashboardPage/     # Teacher dashboard (history)
│       │   ├── ProfilePage/       # Teacher profile + subscription status
│       │   └── admin/             # All admin pages
│       ├── types/                 # TypeScript interfaces
│       └── utils/                 # fingerprint helper, format helpers
│
└── server/                        # Node Express TypeScript backend
    └── src/
        ├── config/                # DB, Passport, OpenAI config
        ├── controllers/           # Auth, Generator, Admin controllers
        ├── middleware/            # JWT auth, role guard, error handler
        ├── models/                # User, Admin, Generation, GuestSession
        ├── routes/                # Auth, Generator, Admin routes
        ├── services/              # openai.service.ts, pptx.service.ts
        ├── types/                 # Server TypeScript types
        └── utils/                 # File helpers, quota checker
    public/
        generated/                 # Saved PPTX files (gitignored)
```

---

## ENVIRONMENT VARIABLES

### /server/.env

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/classgenerator
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=from_google_cloud_console
GOOGLE_CLIENT_SECRET=from_google_cloud_console
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
ADMIN_SEED_EMAIL=admin@classgenerator.app
ADMIN_SEED_PASSWORD=Admin@1234
GUEST_FREE_LIMIT=3
TEACHER_FREE_LIMIT=5
```

### /client/.env

```
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

---

## DATABASE MODELS

### GuestSession

Tracks anonymous usage by browser fingerprint.

- guestId — String, required, unique (UUID generated client-side,
  stored in localStorage as cg_guest_id, sent with every guest request)
- generationCount — Number, default 0
- lastUsed — Date
- createdAt — Date

On every guest generation request:
  1. Client sends X-Guest-ID header with the UUID from localStorage
  2. Server finds or creates GuestSession by guestId
  3. If generationCount >= GUEST_FREE_LIMIT (3): return 403 with
     { limitReached: true }
  4. Otherwise: increment count, proceed with generation

### User (Teachers only)

- googleId — String, required, unique
- name — String, required
- email — String, required, unique
- avatar — String (from Google profile)
- isActive — Boolean, default true
- isSubscribed — Boolean, default false
- subscriptionExpiry — Date (null if not subscribed)
- generationCount — Number, default 0 (resets on new billing cycle)
- billingCycleStart — Date (set on first generation after login or
  after subscription renewal)
- createdAt — Date

Quota logic for authenticated teachers:
  - If isSubscribed AND subscriptionExpiry > now: unlimited generations
  - If NOT subscribed AND generationCount >= TEACHER_FREE_LIMIT (5):
    return 403 with { limitReached: true, needsSubscription: true }
  - Otherwise: increment generationCount and proceed

### Admin

- name — String, required
- email — String, required, unique
- password — String, hashed with bcryptjs, required
- role — String, fixed value "admin"
- createdAt — Date
- Pre-save hook: hash password if modified
- Method: comparePassword(candidate)

### Generation

Records every successful generation.

- userId — ref to User (null if guest)
- guestId — String (null if authenticated)
- topic — String, required
- gradeLevel — String (Kinder / Elementary / High School / College)
- slideCount — Number (how many slides were generated)
- filePath — String (relative path to saved PPTX file)
- fileName — String (user-friendly download name)
- downloadCount — Number, default 0
- createdAt — Date

### PendingPayment

- userId — ref to User
- email — String
- name — String
- submittedAt — Date, default now
- status — String: "pending" | "activated" | "rejected"
- activatedAt — Date (optional)
- activatedBy — ref to Admin (optional)

---

## BACKEND INSTRUCTIONS

### Server Entry Point

- Load env vars with dotenv
- Connect MongoDB
- Initialize passport
- Apply CORS for CLIENT_URL
- Parse JSON body
- Use morgan for dev logging
- Serve /public/generated statically at /files
- Mount all routes under /api
- Serve a health check at GET /api/health
- Global error handler as last middleware

### Auth Routes — /api/auth

GET /api/auth/google
- Redirect to Google OAuth with scope: profile, email
- Session: false

GET /api/auth/google/callback
- On success: sign JWT, redirect to CLIENT_URL/oauth-success?token=JWT
- On fail: redirect to CLIENT_URL?error=auth_failed

POST /api/auth/admin/login
- Body: email, password
- Find admin by email, compare password with bcrypt
- Return JWT + admin object { id, name, email, role }
- Return 401 if credentials wrong

GET /api/auth/me
- Protected: verifyToken
- Return current logged-in user or admin

POST /api/auth/logout
- Protected: verifyToken
- Return success message

### Generator Routes — /api/generate

POST /api/generate (GUEST — no auth required)

Headers required: X-Guest-ID: <uuid>

Flow:
1. Read X-Guest-ID from request headers
2. Find or create GuestSession by guestId
3. If generationCount >= 3: return 403 { limitReached: true,
   message: "You've used all 3 free tries. Sign in to get 5 more!" }
4. Call OpenAI to generate slide content for the given topic
5. Generate PPTX using PptxGenJS, save to /public/generated/
6. Save Generation record (userId: null, guestId: guestId)
7. Increment GuestSession.generationCount
8. Return { fileUrl, fileName, slidesGenerated, remainingTries }

POST /api/generate/auth (AUTHENTICATED TEACHER)

Protected: verifyToken + requireRole("teacher")

Flow:
1. Find user by req.user.id
2. Check subscription status:
   - If isSubscribed && subscriptionExpiry > now: allow (unlimited)
   - If !isSubscribed && generationCount >= 5: return 403
     { limitReached: true, needsSubscription: true,
       message: "You've used all 5 free generations. Subscribe via GCash
       to continue!" }
3. Call OpenAI to generate slide content for the given topic
4. Generate PPTX using PptxGenJS, save to /public/generated/
5. Save Generation record with userId
6. Increment user.generationCount if not subscribed
7. Return { fileUrl, fileName, slidesGenerated, remainingTries }

GET /api/generate/history
Protected: verifyToken + requireRole("teacher")
- Return all Generation records for this user, newest first
- Include: topic, gradeLevel, fileName, fileUrl, slideCount, createdAt

GET /api/generate/quota
Protected: verifyToken + requireRole("teacher")
- Return: { generationCount, freeLimit: 5, isSubscribed,
  subscriptionExpiry, remainingTries }

GET /api/generate/guest-quota
No auth — reads X-Guest-ID header
- Return: { generationCount, freeLimit: 3, remainingTries }

### Admin Routes — /api/admin

All routes: verifyToken + requireRole("admin")

GET /api/admin/stats
- Return: { totalTeachers, activeTeachers, subscribedTeachers,
  totalGenerations, totalGuestGenerations }

GET /api/admin/users
- Paginated list of all teachers
- Query: page, limit, search (name/email), filter (subscribed/active)
- Return: { users, total, page, totalPages }

GET /api/admin/users/:id
- Return single teacher details including generation history

PUT /api/admin/users/:id/status
- Body: { isActive: boolean }
- Toggle teacher active/inactive

PUT /api/admin/users/:id/subscribe
- Body: { isSubscribed: boolean, months: number }
- Set isSubscribed = true, subscriptionExpiry = now + months
- Reset generationCount to 0
- Return updated user

PUT /api/admin/users/:id/reset-quota
- Reset user.generationCount to 0
- Return updated user

GET /api/admin/users/:id/generations
- Return full generation history of a specific teacher (read-only)

GET /api/admin/generations
- Return all generations across all users (paginated)
- Include guest generations

GET /api/admin/payments
- Return all PendingPayments, newest first
- Filter by status query param

PUT /api/admin/payments/:id/activate
- Body: { months: number }
- Update PendingPayment status to "activated"
- Call subscribe logic on the user
- Return updated payment + user

### Payment Route — /api/notify

POST /api/notify/payment
Protected: verifyToken + requireRole("teacher")
- Create PendingPayment record for this user
- Return success message

### Middleware

verifyToken
- Read Authorization: Bearer <token> header
- Verify JWT, get decoded { id, role }
- If role is "admin": find in Admin collection
- If role is "teacher": find in User collection
- Attach user to req.user
- Return 401 if invalid or missing

requireRole(...roles)
- Check req.user.role is in allowed roles
- Return 403 if not

errorHandler
- Global error middleware
- Return { success: false, message } with proper status code

### Admin Seeder

Create /server/src/seeders/adminSeeder.ts
- Check if admin already exists by email from .env
- If not, create admin with hashed password
- Log success or skip message
- Add to package.json: "seed": "ts-node src/seeders/adminSeeder.ts"

### OpenAI — Slide Content Generation

Create /server/src/services/openai.service.ts

When generating slides for a given topic and gradeLevel:

Call gpt-4o with this system prompt:

"You are an expert educational content creator and teacher's assistant.
Your job is to create well-structured, engaging PowerPoint slide content
for classroom presentations.

When given a topic and grade level, generate exactly 10 slides.
Respond ONLY with a valid JSON array — no markdown, no backticks,
no explanation, no preamble.

Format:
[
  {
    slideNumber: 1,
    title: 'Slide title here',
    bullets: [
      'Key point one',
      'Key point two',
      'Key point three'
    ],
    speakerNotes: 'Notes for the teacher to elaborate on this slide'
  }
]

Rules:
- Slide 1 is always a Title slide with the topic as title and subtitle
  'A Classroom Presentation'
- Slide 10 is always a Summary or Q&A slide
- Bullet points should be concise and appropriate for the grade level
- Kinder: very simple, 3-5 words per bullet, fun language
- Elementary: simple sentences, relatable examples
- High School: deeper concepts, analytical thinking prompts
- College: academic language, critical analysis encouraged
- Cover the topic comprehensively across all 10 slides"

User message: "Topic: [topic] | Grade Level: [gradeLevel]"

Parse and return the JSON array.

### PptxGenJS — Slide Generation Service

Create /server/src/services/pptx.service.ts

Design guidelines:
- Slide size: widescreen (13.33 x 7.5 inches)
- Theme colors:
  - Background: white (#FFFFFF)
  - Primary accent: deep blue (#1E40AF)
  - Secondary: light blue (#DBEAFE)
  - Title text: white (#FFFFFF) on blue backgrounds
  - Body text: dark slate (#1E293B)
  - Bullet accent: blue (#1E40AF)

Slide 1 (Title Slide):
- Full blue background
- Topic title: white, bold, 40pt, centered
- Subtitle "A Classroom Presentation": light blue, 20pt, centered
- Grade level label bottom-right: white, 12pt
- Class Generator watermark bottom-left: white 10pt, 50% opacity

Slides 2–9 (Content Slides):
- White background
- Top blue header bar (height 1.2in) with slide title: white, bold, 28pt
- Bullet points below header: 18pt, dark text, left-aligned
- Blue filled circle bullet markers
- Slide number bottom-right: 10pt, gray
- Speaker notes added to each slide's notes field
- Thin blue left-border accent on the content area

Slide 10 (Summary/Closing Slide):
- Full blue background
- "Summary & Key Takeaways" or "Questions?" title: white, 40pt, bold
- Summary bullets: white, 18pt
- "Thank you!" subtext: light blue, 16pt

File naming: slug of topic + timestamp
Example: planets-solar-system-1720000000.pptx
Save to: /server/public/generated/<filename>
Return relative URL: /files/<filename>

---

## FRONTEND INSTRUCTIONS

### Guest ID Management (utils/fingerprint.ts)

```typescript
const GUEST_KEY = 'cg_guest_id';

export function getOrCreateGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}
```

All guest API calls must include header: X-Guest-ID: <guestId>

### Axios Instance

- baseURL from VITE_API_URL
- Request interceptor:
  - If cg_token in localStorage: attach Authorization: Bearer <token>
  - Always attach X-Guest-ID header from getOrCreateGuestId()
- Response interceptor: if 401, remove cg_token, redirect to /

### Auth Context

- State: user (null), role (null), loading (true)
- On mount: if cg_token in localStorage, call GET /api/auth/me
- login(token): save to localStorage cg_token, call getMe, set user + role
- logout(): remove cg_token, call POST /api/auth/logout, clear state
- Export useAuth() hook

### Generator Context

- State: remainingTries, isLimitReached, lastGeneration, isGenerating
- On mount for guest: call GET /api/generate/guest-quota
- On mount for teacher: call GET /api/generate/quota
- updateQuota(): refresh quota from server after each generation
- Export useGenerator() hook

### Routing (App.tsx)

Public routes:
- / — LandingPage (generator, works for all)
- /oauth-success — OAuthSuccess

Admin-only routes:
- /admin/login — AdminLogin
- /admin — AdminDashboard
- /admin/users — ManageUsers
- /admin/users/:id — UserDetail
- /admin/generations — AllGenerations
- /admin/payments — PendingPayments (can also be a section of /admin)

Teacher-only routes:
- /dashboard — DashboardPage (generation history)
- /profile — ProfilePage (account + subscription)

ProtectedRoute:
- If loading: full-page spinner
- If no user: redirect to /
- If wrong role: redirect to /

---

## PAGE INSTRUCTIONS

### LandingPage (/ — Public)

Layout:

1. Navbar
   - Left: Graduation cap icon + "Class Generator" text, bold
   - Right (guest): ghost "Sign in" button
   - Right (teacher): avatar + name + "My History" link + logout button
   - Right (admin): admin should be redirected away from this page to /admin

2. Hero Section
   - Headline: "Generate Classroom Presentations in Seconds"
   - Subheadline: "Type your lesson topic and get a ready-to-download
     PowerPoint — instantly. No design skills needed."
   - Try counter badge (prominent, color-coded):
     - Guest, full tries: green — "✦ 3 free tries — no account needed"
     - Guest, tries decreasing: yellow/orange — "2 tries remaining"
     - Guest, 1 left: orange — "1 try remaining — sign in for more"
     - Guest, 0: red — triggers limit modal
     - Teacher (free): "5 tries remaining this month"
     - Teacher (subscribed): green — "Unlimited generations ✓"

3. Generator Form (centered card, max-width 640px, rounded, shadow)
   - Label: "What topic do you want to teach?"
   - Large textarea (4 rows):
     Placeholder: "e.g. Planets and the Solar System, World War II,
     Photosynthesis, The Water Cycle, Fractions and Decimals..."
   - Grade level selector (styled radio pills or dropdown):
     Options: Kinder | Elementary | High School | College
     Default: Elementary
   - Slide count: always 10, shown as static label: "10 slides"
   - Generate button: large, full-width, deep blue gradient
     Text: "Generate Presentation →"
     Loading state: spinner + "Generating your slides..."
     Disabled while generating or limit reached
   - Helper text below button (guest):
     "Sign in with Google after your free tries to get 5 more"

4. Sample Topic Chips (clickable, auto-fill textarea)
   "The Solar System" | "World War II" | "Photosynthesis" |
   "The Water Cycle" | "Fractions and Decimals" | "The Human Body" |
   "Climate Change" | "Ancient Egypt" | "The Food Chain" | "Democracy"

5. Result Card (appears below form on success)
   - Success banner: green — "Your presentation is ready!"
   - Topic and grade level shown
   - "10 slides generated"
   - Large green download button: "⬇ Download PowerPoint (.pptx)"
   - "Generate another" link (if tries remain)

6. Limit Reached Modals (cannot be dismissed):

   a. Guest limit (after 3 tries):
      - Dark overlay + centered modal
      - Title: "You've used your 3 free tries!"
      - Body: "Sign in with Google to get 5 more free generations.
        No payment required — just your Google account."
      - Button: "Sign in with Google" (Google colors, full-width)

   b. Teacher limit (after 5 tries, no subscription):
      - Dark overlay + centered modal
      - Title: "You've used your 5 free generations!"
      - Subscription card inside modal:
        - "Monthly Subscription — ₱299 / month"
        - Bullet list: Unlimited generations, Full history, Priority support
        - GCash instructions:
          GCash Number: 09XX-XXX-XXXX (replace with real number in .env)
          Reference: [teacher's email address]
          "After paying, click the button below to notify us."
        - Two buttons:
          [Close] — closes modal (they can try from history but can't generate)
          [I've Paid — Notify Admin] — POST /api/notify/payment, then toast:
          "Thanks! We'll activate your account within 24 hours."

7. Features Section (3 columns):
   - "AI-Powered Content" — OpenAI generates educator-quality slide text
   - "Instant Download" — Ready in seconds, standard PPTX format
   - "Teacher-Friendly" — No design skills needed, just type your topic

8. FAQ Accordion:
   - How does the free trial work?
   - What does the generated PowerPoint look like?
   - How do I subscribe?
   - How long until my subscription is activated?
   - Can I edit the downloaded file?
   - What grade levels are supported?

9. Footer:
   - Logo + "Class Generator — AI presentations for every classroom"
   - Links: Privacy Policy, Terms of Use, Contact
   - "© 2025 Class Generator"

### OAuthSuccess Page (/oauth-success)

- On mount: read ?token= from URL search params
- If token: call login(token), navigate to /
- Show centered spinner + "Signing you in..."
- If no token: navigate to / with error toast

### DashboardPage (/dashboard — Teacher only)

- Navbar with logo + avatar + logout
- Page title: "My Presentations"
- Quota card at top:
  - Shows remaining tries or "Unlimited" if subscribed
  - Subscription expiry date if subscribed
  - "Generate New" button → navigates to /
- Generation history:
  - Card grid (2 columns on desktop, 1 on mobile)
  - Each card: topic title, grade level badge, date, slide count,
    Download button (links to file)
  - Empty state: illustration + "No presentations yet. Generate your first one!"
- Pagination if more than 12 items

### ProfilePage (/profile — Teacher only)

- Avatar (Google photo) + name + email (read-only fields for email)
- Edit name input with save button
- Subscription status section:
  - Subscribed: green badge "Active Subscriber" + "Valid until [date]"
  - Not subscribed: gray "Free Tier" + "X of 5 generations used"
    + "Subscribe" button (opens subscription modal)
- Stats row: Total presentations, Member since, Grade levels used

### AdminLogin Page (/admin/login)

- Clean login form: email + password
- Validate with React Hook Form + Zod
- POST /api/auth/admin/login on submit
- On success: navigate to /admin
- Error toast on wrong credentials
- No Google option
- Back link to /

### Admin Dashboard Layout

Sidebar (fixed left, collapsible on mobile):
- Logo + "Admin Panel"
- Links: Dashboard, Users, Generations, Payments, Logout
- Active link indicator
- Accent color: deep blue (#1E40AF)

### AdminDashboard (/admin)

- 5 stat cards:
  Total Teachers | Active | Subscribed | Total Generations | Guest Uses
- Line chart: generations per day for last 30 days (use recharts)
- Pending Payments panel (if any):
  - Yellow warning banner: "X payments awaiting activation"
  - Table: teacher name, email, submitted date, Activate button
  - Activate opens modal: choose 1 month (₱299) or 3 months (₱799)
- Recent signups: last 5 teachers
- Recent generations: last 10 (user, topic, grade, date, download)

### ManageUsers (/admin/users)

- Search bar + filter by subscription status + filter by active status
- Table: avatar, name, email, active badge, subscribed badge,
  generations used, joined date, Actions
- Actions per row:
  - View → /admin/users/:id
  - Toggle Active (icon button + confirm)
  - Reset Quota (icon button + confirm dialog)
  - Grant Subscription (opens modal: 1 month / 3 months)
- Pagination

### UserDetail (/admin/users/:id)

- Teacher profile: avatar, name, email, isActive, isSubscribed,
  subscriptionExpiry, generationCount, billingCycleStart, createdAt
- Action buttons: Toggle Active, Reset Quota, Grant Subscription
- Generation history: topic, gradeLevel, date, slide count, download link
- Back button to /admin/users

### AllGenerations (/admin/generations)

- Table: type (Guest/Teacher), user (name or "Guest"),
  topic, grade level, slides, date, download
- Search by topic or user
- Filter: All / Teacher / Guest
- Pagination

---

## UI & DESIGN RULES

- TailwindCSS only — no inline styles, no external CSS files
- Fully responsive: mobile first
- Color palette:
  - Primary: deep blue #1E40AF (buttons, headers)
  - Light blue: #DBEAFE (backgrounds, badges)
  - Success: green #16A34A (download buttons, subscribed badges)
  - Warning: amber #D97706 (try counter warnings, pending payments)
  - Danger: red #DC2626 (errors, deactivated, 0 tries left)
  - Text: #1E293B (headings), #334155 (body), #64748B (muted)
  - Background: #FFFFFF / #F8FAFC
- Try counter color coding:
  - 3 (full): green
  - 2: yellow-green
  - 1: orange
  - 0: red → show modal
- Modals: dark overlay, no dismiss when limit reached
- Download buttons: always green and large
- Smooth fade transitions on modals
- Loader on every async operation
- Toasts for all errors and success confirmations
- Avatars: Google photo with initials fallback

---

## SCRIPTS & COMMANDS

### Server package.json scripts:

```json
{
  "dev": "nodemon --exec ts-node src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "ts-node src/seeders/adminSeeder.ts"
}
```

### Client package.json scripts:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### Commands after all files are created:

```bash
# Terminal 1 — seed admin then start backend
cd server
npm install
npm run seed
npm run dev

# Terminal 2 — start frontend
cd client
npm install
npm run dev
```

---

## GCASH PAYMENT FLOW (Manual)

Since there is no GCash API, use manual admin confirmation:

1. Teacher hits 5-try limit → subscription modal appears
2. Modal shows GCash number, amount (₱299/month), and reference (email)
3. Teacher pays on their phone, clicks "I've Paid — Notify Admin"
4. POST /api/notify/payment creates a PendingPayment record
5. Admin sees it in the Pending Payments panel on /admin dashboard
6. Admin clicks "Activate" → modal to choose 1 or 3 months
7. PUT /api/admin/payments/:id/activate sets isSubscribed = true,
   calculates subscriptionExpiry, resets generationCount to 0
8. Teacher is now subscribed and can generate unlimited presentations

GCash settings (put in server .env):
```
GCASH_NUMBER=09XX-XXX-XXXX
GCASH_ACCOUNT_NAME=Your Name Here
MONTHLY_PRICE=299
THREE_MONTH_PRICE=799
```

Display these values dynamically in the subscription modal (fetch via
GET /api/settings/payment — a public route that returns these values
from env, never expose other env vars).

---

## README.md

Create README.md at project root with:

- Project name: Class Generator
- Tagline: AI-powered PowerPoint presentations for teachers, instantly.
- Description
- Screenshot placeholder
- Prerequisites: Node 18+, MongoDB, Google OAuth credentials, OpenAI API key
- Step-by-step setup
- Google OAuth setup link: console.cloud.google.com
- OpenAI API key link: platform.openai.com
- All environment variables explained
- Default admin credentials: admin@classgenerator.app / Admin@1234
- Routes for all three user types (Guest, Teacher, Admin)
- GCash payment flow explained
- Tech stack

---

## FINAL CHECKLIST FOR CLAUDE CODE

Before finishing, verify every item is complete:

- [ ] All folders and files created exactly as specified
- [ ] TypeScript compiles with no errors on both client and server
- [ ] Guest UUID generated, stored in localStorage as cg_guest_id,
      sent with every guest API request via X-Guest-ID header
- [ ] Guest generation count persists across page refreshes
      (stored in MongoDB GuestSession, NOT only in localStorage)
- [ ] Try counter badge is visible and updates correctly after each use
- [ ] Try counter is color-coded: green → yellow → orange → red
- [ ] Guest limit modal appears at 0 tries and cannot be dismissed
- [ ] Google OAuth flow works: login → redirect → token → /
- [ ] Teacher try counter works (5 free tries per billing cycle)
- [ ] Teacher limit modal shows GCash payment instructions
- [ ] "I've Paid" button creates PendingPayment record
- [ ] Admin sees pending payments panel on dashboard
- [ ] Admin can activate subscription (1 or 3 months)
- [ ] Activated teacher gets generationCount reset to 0
- [ ] OpenAI generates valid 10-slide JSON for any topic + grade level
- [ ] PptxGenJS builds a styled, downloadable PPTX from the JSON
- [ ] PPTX saved to /server/public/generated/ and served at /files/
- [ ] Download button works and triggers browser file download
- [ ] Grade level selection affects OpenAI content appropriately
- [ ] Sample topic chips auto-fill the textarea on click
- [ ] Generation history visible on /dashboard for teachers
- [ ] Admin can view all users, toggle status, reset quota
- [ ] Admin can grant subscription manually
- [ ] Admin can view all generations including guest ones
- [ ] ProtectedRoute blocks wrong roles and redirects
- [ ] All forms have validation with inline errors (React Hook Form + Zod)
- [ ] All async actions have loading states with spinners
- [ ] All errors show toast notifications (React Toastify)
- [ ] App fully responsive on mobile and desktop
- [ ] README.md complete with all setup instructions
- [ ] .env files listed in .gitignore
- [ ] /server/public/generated/ listed in .gitignore
- [ ] No hardcoded secrets anywhere in the codebase

---

## HOW TO USE THIS FILE

1. Create an empty folder called `class-generator`
2. Open it in VS Code
3. Save this file as `CLAUDE.md` in the root
4. Open Claude Code (Ctrl+Shift+P → Claude Code)
5. Type: `Read CLAUDE.md and build the entire Class Generator app
   following every instruction`
6. Let it run — it will build everything file by file