# auth

Email/password sign-in and sign-up, built on Auth.js (NextAuth v5) with
a Drizzle Postgres adapter. Sign-in/sign-up UI is fully custom (see
`components/SignInForm.tsx` / `SignUpForm.tsx`) - Auth.js is used purely
as the session/credentials engine, not for its hosted pages.

## Enable it

1. Set `auth.enabled: true` in `features.config.ts`.
2. Set `DATABASE_URL` (see `.env.example` / `.devcontainer/`).
3. Set `AUTH_SECRET` (generate with `npx auth secret`).
4. Run `npm run db:generate && npm run db:migrate`.

## Routes

- `/sign-in`, `/sign-up` — shims in `app/(auth)/` re-exporting from `routes/`.
- `/api/auth/[...nextauth]` — Auth.js's session/callback endpoints.

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

## Deleting this feature

Remove `app/(auth)/`, `app/api/auth/`, this folder, the `auth` entry from
`features.schema.ts`/`features.config.ts`, the `authFeature` import/entry
in `features/registry.ts`, and the `export * from "@/features/auth/db/schema"`
line in `lib/db/schema.ts`. Then `npm uninstall next-auth @auth/drizzle-adapter bcryptjs`.
