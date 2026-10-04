# CleanJobData Next.js Job Board Starter

A production-ready job board template built with **Next.js 16**,
**Tailwind CSS v4**, and the **CleanJobData API** - job listings out of
the box, plus optional accounts, resumes, applications tracking,
self-service job posting, an admin dashboard, and email alerts, each
independently switched on or off.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS v4, a token/preset theming system (see
  "Styling/theming" below), Headless UI for accessible unstyled
  primitives (dialogs, comboboxes, tabs).
- **Database/ORM**: Postgres + Drizzle ORM (only needed once a
  DB-backed feature is enabled - see the feature table below).
- **Auth**: NextAuth.js (email/password, optional Google/LinkedIn OAuth).
- **Email**: Resend (optional - only needed for email verification and
  `jobAlerts`).
- **File storage**: local disk or S3-compatible storage (optional -
  only needed for `resume`/`jobPosting` uploads).
- **AI**: Anthropic's API (optional - only used as a fallback for
  resume parsing in the `resume` feature).
- **Jobs data**: the [CleanJobData API](https://cleanjobdata.com) -
  the one dependency every deployment needs.

## 🚀 Quick Start (jobs listing only)

The fastest way to get a *jobs-listing-only* board live is to fork this
repo and deploy it with just the CleanJobData API key configured - no
database required for this path.

1. **Fork this repo** to your own GitHub account.
2. **Deploy** using one of the platforms below.
3. **Configure** your API key from the [CleanJobData Dashboard](https://cleanjobdata.com/dashboard).

For every other feature (accounts, resumes, applications, job posting,
admin, alerts, onboarding), see "Full setup" below - each needs
Postgres, and some need one more service on top of that.

## 🛠 Deployment

Deploy your forked repository in seconds:

- **Vercel**: The recommended platform for Next.js. [Deploy Now](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCleanJobData%2Fnextjs-job-board-starter&repository-name=nextjs-job-board-starter&project-name=cleanjobdata-job-board&env=CLEANJOBDATA_API_URL,CLEANJOBDATA_API_KEY,NEXT_PUBLIC_SITE_NAME&envDescription=API_URL,API_KEY,SITE_NAME)
- **Netlify**: Great for static and serverless sites. [Deploy Now](https://app.netlify.com/start/deploy?repository=https://github.com/CleanJobData/nextjs-job-board-starter)

## Core jobs-listing features

- **Modern Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4.
- **Fast & Scannable**: Optimized job grid with server-side rendering and cursor-based pagination.
- **Advanced Filtering**: Search by title, location (with geo-suggestions), remote, seniority, salary, and more.
- **URL Synchronization**: All filter states are synced to the URL for easy bookmarking and sharing.
- **Side Panel View**: Intercepting routes for a seamless "side view" of job details without losing your place in the list.
- **Responsive Design**: Mobile-first approach with a dedicated filter drawer for smaller screens.
- **Theme Support**: Built-in light and dark mode with zero flash on load, plus a token-based theming system - see "Styling/theming" below.
- **Type Safe**: Strict TypeScript implementation for all API responses and application state.

## Optional features

Everything below lives under `features/<name>/`, is switched on/off in
one place (`features.config.ts`), and has its own README with the full
setup detail - env vars, DB tables, routes, known limitations, and how to
remove it cleanly if you don't want it. This list is a map, not the
setup guide itself.

| Feature | What it adds | Needs beyond Postgres | README |
|---|---|---|---|
| `auth` | Email/password + optional Google/LinkedIn sign-in | Nothing required; email verification needs Resend | [features/auth](features/auth/README.md) |
| `jobSync` | The CleanJobData ingestion pipeline itself, plus a scheduler hitting `/api/cron` | Nothing extra | [features/job-sync](features/job-sync/README.md), [docs/CRON.md](docs/CRON.md) |
| `resume` | Upload/parse a PDF resume or build one from scratch, ATS check, PDF export in 4 templates | File storage (local disk or S3); optionally Anthropic for AI parsing | [features/resume](features/resume/README.md) |
| `applications` | A kanban board tracking jobs a user has saved/applied to | Nothing extra | [features/applications](features/applications/README.md) |
| `jobPosting` | Self-service company profiles + job postings | File storage (company logos) | [features/job-posting](features/job-posting/README.md) |
| `admin` | Moderation queue, alert-sending controls, sync status, user roles | Nothing extra (needs `auth` + a `users.role = "admin"` account) | [features/admin](features/admin/README.md) |
| `jobAlerts` | Scheduled email digests of new matching jobs | Resend (email) + the same cron scheduler as `jobSync` | [features/job-alerts](features/job-alerts/README.md) |
| `onboarding` | One-step "Job Seeker / Employer" flow right after sign-up | Nothing extra | [features/onboarding](features/onboarding/README.md) |

Real dependencies exist between a few of these (e.g. `applications` reads
`jobSync`'s data, `jobAlerts` reuses `onboarding`'s preferences UI) - each
feature's own README calls out what it actually needs.

## Full setup (local development, everything enabled)

### 1. Clone the repository

```bash
git clone https://github.com/CleanJobData/nextjs-job-board-starter.git
cd nextjs-job-board-starter
npm install
```

**Prefer not to install Node/Postgres locally?** This repo includes a
[dev container](.devcontainer) (VS Code "Dev Containers" extension, or
GitHub Codespaces) that boots the app alongside a Postgres instance with
zero local setup - open the folder, "Reopen in Container", then skip to
step 5 once it finishes installing and migrating.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

`.env.example` is fully commented with every variable any feature might
need, and which features need it - fill in what's relevant to the
features you're enabling. At minimum: `CLEANJOBDATA_API_URL`/
`CLEANJOBDATA_API_KEY` (jobs data) and, once any DB-backed feature is on,
`DATABASE_URL`.

### 3. Choose your features

Edit `features.config.ts` - set `enabled: true`/`false` per feature (see
the table above). All eight currently default to `true` in this repo;
turn off what you don't need.

### 4. Set up the database (once any DB-backed feature is enabled)

```bash
npm run db:generate   # generate a migration from the current schema
npm run db:migrate    # apply it
npm run db:studio     # optional: browse the DB in Drizzle Studio
```

If you enabled `auth` and want an admin account for the `admin` feature,
sign up normally in the app, then:

```bash
npm run promote-admin -- you@example.com
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3450](http://localhost:3450).

### 6. Styling/theming

Edit `theme.config.ts` (preset, font, corner radius, spacing density,
default light/dark mode) - one file, same "edit values, don't add logic"
shape as `features.config.ts`. For a full custom palette, use
`preset: "custom"` and edit `app/globals.css`'s token values directly.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full token list,
how presets/fonts/dark-mode actually wire together, and the "always use
design tokens, never a raw color" rule the shared UI library
(`components/ui/*`) already follows.

### 7. Scheduled tasks

`jobSync` and `jobAlerts` both need something calling `POST /api/cron`
on a schedule (Vercel Cron, GitHub Actions, or a plain crontab all work)
- see [docs/CRON.md](docs/CRON.md).

## API Reference

This template connects to the [CleanJobData Jobs API](https://api.cleanjobdata.com/docs).

| Filter | API Parameter | Description |
|--------|---------------|-------------|
| Keywords | `title` | Search job titles (supports `;` for OR) |
| Location | `city_id`, `state_id`, `country_id` | Geographic filtering via IDs |
| Remote | `remote=true` | Filter for remote-only positions |
| Seniority | `experience_level` | EN, MI, SE, EX |
| Salary | `salary` | Min salary (e.g., `50000`) |
| Posted | `max_age` | Filter by days since published |

## License

MIT License - feel free to use this for your own projects!

---

Built by [CleanJobData](https://cleanjobdata.com)
