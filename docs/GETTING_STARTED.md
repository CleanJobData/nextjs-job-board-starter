# Getting Started

> **New here?** Start with the [README](../README.md) — it has the full step-by-step setup guide.
> This page is a quick reference once you've got the basics running.

---

## Checklist — bare minimum (jobs listing only)

- [ ] CleanJobData account + API key → [cleanjobdata.com/dashboard](https://cleanjobdata.com/dashboard)
- [ ] `CLEANJOBDATA_API_URL` and `CLEANJOBDATA_API_KEY` set in `.env.local`
- [ ] `NEXT_PUBLIC_SITE_NAME` set
- [ ] `npm run dev` (or deployed to Vercel/Netlify)

That's enough for a working jobs listing with search and filters.

---

## Checklist — adding user accounts + more features

- [ ] Postgres database set up (free tier: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- [ ] `DATABASE_URL` set in `.env.local`
- [ ] Features enabled in `features.config.ts`
- [ ] `npm run db:generate && npm run db:migrate` run
- [ ] If using email features: `RESEND_API_KEY` + `EMAIL_FROM` set
- [ ] If using resume AI parsing: `ANTHROPIC_API_KEY` set
- [ ] If using file uploads: storage configured (see [features/resume/README.md](../features/resume/README.md))
- [ ] If using `admin`: ran `npm run promote-admin -- you@email.com`
- [ ] If using `jobSync` or `jobAlerts`: cron set up → see [CRON.md](CRON.md)

---

## Common environment variables

| Variable | What it's for | Required? |
|---|---|---|
| `CLEANJOBDATA_API_URL` | Base URL for the jobs API | ✅ Always |
| `CLEANJOBDATA_API_KEY` | Your API key | ✅ Always |
| `NEXT_PUBLIC_SITE_NAME` | Your board's name | ✅ Always |
| `DATABASE_URL` | Postgres connection string | Once any DB feature is on |
| `NEXTAUTH_SECRET` | Random secret for auth sessions | Once `auth` is on |
| `NEXTAUTH_URL` | Your site's full URL | Once `auth` is on |
| `RESEND_API_KEY` | Resend email service key | For email verify + `jobAlerts` |
| `EMAIL_FROM` | From address for emails | For email verify + `jobAlerts` |
| `ANTHROPIC_API_KEY` | AI resume parsing | Optional — `resume` falls back gracefully |
| `CRON_SECRET` | Secures the `/api/cron` endpoint | Once `jobSync` or `jobAlerts` is on |

The full list with comments is in `.env.example`.

---

## Useful commands

```bash
npm run dev              # start local dev server on port 3450
npm run build            # production build
npm run db:generate      # generate a new migration from schema changes
npm run db:migrate       # apply pending migrations
npm run db:studio        # open Drizzle Studio (visual DB browser)
npm run promote-admin -- you@email.com  # give an account admin access
```

---

## Where to find things

| What | Where |
|---|---|
| Turn features on/off | `features.config.ts` |
| Change the look/theme | `theme.config.ts` |
| All env vars explained | `.env.example` |
| Per-feature setup detail | `features/<name>/README.md` |
| Cron / scheduled jobs | [docs/CRON.md](CRON.md) |
| Theme system internals | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |

---

## Need help or want it done for you?

- **Docs & API reference**: [api.cleanjobdata.com/docs](https://api.cleanjobdata.com/docs)
- **Support**: [cleanjobdata.com/support](https://cleanjobdata.com/support)
- **Want a fully built, hosted job board?** We build custom boards as a service → [cleanjobdata.com/services](https://cleanjobdata.com/services)
