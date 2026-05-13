# 🚗 CarCost — Car Expense Tracker

A production-ready SaaS app for tracking car expenses in Israel. Built with Next.js 14, Tailwind CSS, and Supabase.

---

## 🗂️ Project Structure

```
carcost/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell + auth check
│   │   ├── page.tsx                # Main dashboard (all cars)
│   │   ├── DashboardNav.tsx        # Top + mobile bottom nav
│   │   └── cars/
│   │       ├── new/page.tsx        # Add new car
│   │       └── [id]/page.tsx       # Car detail + expenses
│   ├── layout.tsx                  # Root layout + PWA meta
│   ├── page.tsx                    # Root redirect
│   └── globals.css                 # Global styles + fonts
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   └── utils.ts                    # Currency, dates, helpers
├── types/index.ts                  # TypeScript types
├── middleware.ts                   # Auth route protection
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── icons/icon.svg              # App icon (SVG)
└── scripts/generate-icons.js       # Icon generation helper
```

---

## ⚡ Quick Setup (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo>
cd carcost
npm install
```

### 2. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com) → **New Project**
2. Pick a name (e.g. `carcost`), strong password, closest region
3. Wait for it to start (~1 min)

### 3. Run the Database Migration

Go to your Supabase project → **SQL Editor** → **New query**, paste and run:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Cars table
create table public.cars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  plate_number text,
  year integer,
  created_at timestamptz default now() not null
);

-- Expenses table
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid references public.cars(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null check (amount > 0),
  category text not null check (category in ('fuel', 'maintenance', 'repairs', 'other')),
  date date not null,
  notes text,
  created_at timestamptz default now() not null
);

-- Reminders table
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  car_id uuid references public.cars(id) on delete cascade not null unique,
  insurance_date date,
  test_date date,
  updated_at timestamptz default now() not null
);

-- Row Level Security
alter table public.cars enable row level security;
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;

-- Cars RLS
create policy "Users can manage their own cars"
  on public.cars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expenses RLS
create policy "Users can manage their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminders RLS (via car ownership)
create policy "Users can manage reminders for their cars"
  on public.reminders for all
  using (
    exists (
      select 1 from public.cars
      where cars.id = reminders.car_id
      and cars.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cars
      where cars.id = reminders.car_id
      and cars.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_cars_user_id on public.cars(user_id);
create index idx_expenses_car_id on public.expenses(car_id);
create index idx_expenses_user_id on public.expenses(user_id);
create index idx_expenses_date on public.expenses(date);
create index idx_reminders_car_id on public.reminders(car_id);
```

### 4. Configure Auth (Optional but Recommended)

In Supabase → **Authentication** → **Settings**:
- Set **Site URL** to your production URL (e.g. `https://carcost.vercel.app`)
- Add `http://localhost:3000` to **Redirect URLs** for local dev

### 5. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in Supabase → **Settings** → **API**.

### 6. Generate Icons (Optional)

```bash
# Option A: Use sharp
npm install -g sharp-cli
sharp -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192
sharp -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512

# Option B: Use an online tool
# Upload public/icons/icon.svg to https://realfavicongenerator.net/
# Download and place icon-192.png and icon-512.png in public/icons/
```

### 7. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🚀 Deploy to Vercel

### Option A: Via CLI

```bash
npm install -g vercel
vercel
# Follow prompts, then add env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

### Option B: Via GitHub + Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Select your repo
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** ✅

### After Deploying

Update Supabase Auth settings:
- Supabase → **Authentication** → **Settings** → **Site URL**: set to your Vercel URL
- Add your Vercel URL to **Redirect URLs**

---

## 📱 PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add**

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **menu** (⋮) → **Add to Home Screen**
3. Or wait for the browser banner prompt

---

## 🔧 Features

| Feature | Status |
|---------|--------|
| Email/password auth | ✅ |
| Add/delete cars | ✅ |
| Track expenses (fuel, maintenance, repairs, other) | ✅ |
| Monthly & yearly totals per car | ✅ |
| Dashboard overview (all cars) | ✅ |
| Insurance & test (MOT) reminders with countdown | ✅ |
| Category filtering | ✅ |
| Delete expenses | ✅ |
| Dark mode UI | ✅ |
| Mobile-first responsive design | ✅ |
| PWA installable | ✅ |
| Row Level Security (data isolated per user) | ✅ |

---

## 🛡️ Security

- All data protected with Supabase Row Level Security (RLS)
- Users can only access their own cars and expenses
- Auth handled entirely by Supabase
- No sensitive data stored in the browser
- Middleware validates session on every protected route

---

## 🇮🇱 Israel-Specific Notes

- Currency displayed in **₪ NIS** (Israeli Shekel)
- "Test" reminder refers to **טסט** (annual vehicle inspection)
- Date format: DD MMM YYYY (universal)
- App works with Israel-based Supabase region (EU West is closest)

---

## 📁 Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Framework |
| Tailwind CSS | Styling |
| Supabase | Auth + Database (PostgreSQL) |
| @supabase/ssr | SSR auth cookies |
| date-fns | Date utilities |
| Vercel | Deployment |

---

## 🐛 Troubleshooting

**"Relation does not exist" error**
→ Make sure you ran the SQL migration in Supabase SQL Editor

**Auth redirect not working**
→ Add your URL to Supabase → Auth → Settings → Redirect URLs

**PWA not installing**
→ Make sure you have icon-192.png and icon-512.png in public/icons/

**RLS blocking data access**
→ Check that the policies were created (Supabase → Table Editor → [table] → Policies)

---

## 📝 License

MIT — use freely for personal or commercial projects.
