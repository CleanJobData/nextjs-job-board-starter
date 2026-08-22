# auth

Email/password sign-in and sign-up, built on Auth.js (NextAuth v5) with
a Drizzle Postgres adapter. Sign-in/sign-up UI is fully custom (see
`components/SignInForm.tsx` / `SignUpForm.tsx`) - Auth.js is used purely
as the session/credentials engine, not for its hosted pages.

## Config (`features.config.ts` -> `auth`)

- `enabled` - turn the whole feature on/off.
- `credentials` - email/password sign-in (default `true`).
- `oauthProviders` - array of `"google" | "linkedin"` to wire up. Each needs
  its own env vars (Auth.js v5 infers them by name, nothing to pass in code):
  - Google: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - LinkedIn: `AUTH_LINKEDIN_ID`, `AUTH_LINKEDIN_SECRET`
- `emailVerification` - when `true`, sign-up sends a verification email
  (via `lib/email/`) instead of an immediately-usable account, and sign-in
  is blocked (with a clear message, error code `email-not-verified`) until
  the link is clicked. Requires `RESEND_API_KEY`/`EMAIL_FROM` - see below.

## Enable it

1. Set `auth.enabled: true` in `features.config.ts` (and `credentials`/`oauthProviders`/`emailVerification` as desired).
2. Set `DATABASE_URL` (see `.env.example` / `.devcontainer/`).
3. Set `AUTH_SECRET` (generate with `npx auth secret`).
4. If using OAuth, set that provider's env vars (see above).
5. If `emailVerification: true`, set `RESEND_API_KEY`/`EMAIL_FROM` (see below).
6. Run `npm run db:generate && npm run db:migrate`.

## Routes

- `/sign-in`, `/sign-up` — shims in `app/(auth)/` re-exporting from `routes/`.
- `/verify-email?token=&email=` — only reachable when `emailVerification` is on.
- `/api/auth/[...nextauth]` — Auth.js's session/callback endpoints.

## Email verification

Sending is done through `lib/email/mailer.ts` (Resend by default, one
`Mailer` interface - see that file to swap providers) and templates live in
`lib/email/templates/` (React Email components, rendered to HTML by
`lib/email/render.ts`). `features/auth/lib/verification.ts` generates the
token (stored in `verificationTokens`, 24h expiry, single-use), sends
`lib/email/templates/VerifyEmailTemplate.tsx`, and consumes the token when
the user clicks through.

If you'd rather use a provider's own hosted templates (e.g. Brevo's
template-by-ID system) instead of writing HTML here, that's a different
call shape (`send(templateId, variables)` vs. our `send(html)`) - it isn't
a drop-in `Mailer` swap, you'd add a second send method or a different
mailer for that path. See the note in `lib/email/mailer.ts`.

## DB tables

`users`, `accounts`, `sessions`, `verificationTokens` — the shape
`@auth/drizzle-adapter` expects, plus `users.passwordHash` for the
credentials provider (Auth.js core doesn't manage passwords itself).

## Third-party deps

`next-auth` (beta - v5/Auth.js), `@auth/drizzle-adapter`, `bcryptjs`.

## Notes for other features

Any feature needing "is someone signed in" should call
`features/authGuard.ts`'s `checkAccess(featureKey)` rather than importing
`auth()` directly - it also handles the `guestAccess` flag and the case
where `auth.enabled` is false entirely (everything becomes guest-accessible).

Anything needing "is this an admin" should call that same file's
`requireAdmin()`.

## Admin role

`users.role` (`"user" | "admin"`, default `"user"`) backs
`features/authGuard.ts`'s `requireAdmin()`, for the phase 3 admin
dashboard to gate its routes/actions with. There's no UI to promote a user
yet - to bootstrap the first admin for local dev/testing, sign up normally
then run:

```
npm run promote-admin -- you@example.com
```

(`scripts/promote-admin.ts` - a dev convenience, not a real feature.)

## Deleting this feature

Remove `app/(auth)/`, `app/api/auth/`, this folder, the `auth` entry from
`features.schema.ts`/`features.config.ts`, the `authFeature` import/entry
in `features/registry.ts`, and the `export * from "@/features/auth/db/schema"`
line in `lib/db/schema.ts`. Then `npm uninstall next-auth @auth/drizzle-adapter bcryptjs`.
