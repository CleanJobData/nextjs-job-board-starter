# CleanJobData Next.js Job Board Starter

A ready-to-deploy job board. Real job listings from the CleanJobData API, plus optional user accounts, resume builder, application tracking, job posting, admin tools, and email alerts.

**Every feature is a single on/off switch.** You can go live with just the jobs listing in minutes, then turn on more features whenever you're ready.

---

## 🧱 How it works (the simple version)

1. You get the code (clone or deploy with one click)
2. You add your CleanJobData API key
3. You pick which features you want
4. You run it — or deploy it to Vercel / Netlify

That's it.

---

## 🚀 Option A — Deploy in one click (easiest)

No local setup needed.

1. Go to [cleanjobdata.com](https://cleanjobdata.com/dashboard) and create a free account
2. Copy your API key from the dashboard
3. Click one of these:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCleanJobData%2Fnextjs-job-board-starter&repository-name=nextjs-job-board-starter&project-name=cleanjobdata-job-board&env=CLEANJOBDATA_API_URL,CLEANJOBDATA_API_KEY,NEXT_PUBLIC_SITE_NAME&envDescription=API_URL,API_KEY,SITE_NAME)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/CleanJobData/nextjs-job-board-starter)

4. Fill in the variables it asks for:
   - `CLEANJOBDATA_API_URL` → `https://api.cleanjobdata.com`
   - `CLEANJOBDATA_API_KEY` → your key from the dashboard
   - `NEXT_PUBLIC_SITE_NAME` → whatever you want to call your board

Your job board is live. ✅

> **Want more features?** Keep reading — accounts, resumes, etc. need a database (Postgres). You can add those later.

---

## 🛠 Option B — Run it locally (for developers)

### Step 1 — Get the code

```bash
git clone https://github.com/CleanJobData/nextjs-job-board-starter.git
cd nextjs-job-board-starter
npm install
```

> **No Node.js on your machine?** Open the folder in VS Code and click "Reopen in Container" — the dev container sets everything up automatically including Postgres. Then skip to Step 4.

---

### Step 2 — Set up your environment file

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at minimum:

```env
CLEANJOBDATA_API_URL=https://api.cleanjobdata.com
CLEANJOBDATA_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_NAME=My Job Board
```

The `.env.example` file lists every other variable and which feature needs it — read the comments there.

---

### Step 3 — Choose your features

Open `features.config.ts`. It looks like this:

```ts
export const featuresConfig = {
  jobSync:      { enabled: true },   // caches jobs in your DB — recommended
  auth:         { enabled: true },   // user accounts
  resume:       { enabled: true },   // resume builder
  applications: { enabled: true },   // job application tracker
  jobPosting:   { enabled: true },   // let employers post jobs
  admin:        { enabled: true },   // admin moderation dashboard
  jobAlerts:    { enabled: true },   // email digests of new jobs
  onboarding:   { enabled: true },   // setup wizard for new users
};
```

**Just want a simple jobs listing?** Set everything except `jobSync` to `false` and skip Step 4.

**Want the full experience?** Leave everything `true` and do Step 4.

---

### Step 4 — Set up the database (skip if all features are off)

You need a Postgres database. Any provider works — [Neon](https://neon.tech) and [Supabase](https://supabase.com) both have free tiers.

Once you have a connection string, add it to `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Then run:

```bash
npm run db:generate   # creates the database tables
npm run db:migrate    # applies them
```

That's it — your database is ready.

> **Want to browse your database visually?** Run `npm run db:studio` and open the link it gives you.

---

### Step 5 — Start it up

```bash
npm run dev
```

Open [http://localhost:3450](http://localhost:3450) — your job board is running. 🎉

---

### Step 6 — (Optional) Make yourself an admin

If you turned on the `admin` feature, sign up normally in the app first, then run:

```bash
npm run promote-admin -- you@youremail.com
```

Now you can access `/admin` with moderation tools, sync status, and user management.

---

## ✨ What each feature does

| Feature | What it adds | What it needs |
|---|---|---|
| `jobSync` | Caches jobs from CleanJobData into your own DB. Fast filters, no rate-limit risk. **Recommended.** | Postgres + a cron job hitting `/api/cron` |
| `auth` | User accounts (email/password). Optional Google/LinkedIn OAuth. | Postgres. Resend for email verification (optional) |
| `resume` | Resume builder, PDF upload, ATS check, PDF export in 4 templates | Postgres + file storage (local disk or S3). Optional: Anthropic key for AI parsing |
| `applications` | Kanban board — Saved → Applied → Interviewing → Offer → Rejected | Postgres |
| `jobPosting` | Employers can create company profiles and post jobs | Postgres + file storage (for logos) |
| `admin` | Moderation queue, user management, sync dashboard | Postgres + `auth` + an admin account |
| `jobAlerts` | Email digests of new jobs matching a user's saved preferences | Postgres + Resend + cron |
| `onboarding` | A short setup wizard for new users (role, location, preferences) | Postgres + `auth` |

Each feature has its own README in `features/<name>/README.md` with the full details.

---

## 🎨 Changing the look

Edit `theme.config.ts`:

```ts
export const themeConfig = {
  preset: "default",    // "default" | "warm" | "minimal-mono" | "custom"
  font: "sans",         // "sans" | "mono"
  radius: "md",         // "none" | "sm" | "md" | "lg"
  density: "default",   // "compact" | "default" | "comfortable"
  defaultMode: "system" // "light" | "dark" | "system"
};
```

For a fully custom color palette, set `preset: "custom"` and edit the token values in `app/globals.css`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the theme system works in depth.

---

## ⏰ Scheduled tasks

`jobSync` and `jobAlerts` need something calling `POST /api/cron` on a schedule (every hour is a good default).

See [docs/CRON.md](docs/CRON.md) for how to set this up on Vercel, GitHub Actions, or a plain crontab.

---

## 🏗 Want us to build your job board for you?

If you'd rather skip the setup and get a fully branded, hosted job board built for you — we offer that as a service.

**[Contact us at cleanjobdata.com/services](https://cleanjobdata.com/services)**

We handle everything: custom design, your domain, ongoing hosting, and API access included.

---

## License

MIT — use it for anything.

Built by [CleanJobData](https://cleanjobdata.com)
