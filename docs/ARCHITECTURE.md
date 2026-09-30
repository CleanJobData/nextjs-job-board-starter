# Architecture

Two independent "picker" systems drive what a cloned deployment looks
like and does: `features.config.ts` (which features exist) and
`theme.config.ts` (how everything looks). Both are designed the same
way on purpose - a single flat config object a future CleanJobData
picker tool would generate and drop into a cloned repo, not something
you write logic into by hand.

## Features: `features.config.ts` + `features.schema.ts` + `features/registry.ts`

Every optional part of the app - `auth`, `jobSync`, `resume`,
`applications`, `jobPosting`, `admin`, `jobAlerts`, `onboarding` - lives
under `features/<name>/` as a self-contained module: its own
`db/schema.ts`, `actions/*.ts` (server actions), `components/*`,
`routes/*/page.tsx`, and usually a `README.md`.

- **`features.schema.ts`** is the zod schema for what's configurable per
  feature (`enabled`, `guestAccess` where it applies, and whatever
  feature-specific flags exist - e.g. `resume.aiParsing`,
  `jobPosting.requireVerification`).
- **`features.config.ts`** is the actual values for this deployment -
  edit this file to turn features on/off, not the schema.
- **`features/<name>/feature.ts`** exports a `FeaturePlugin` (see
  `features/registry.ts`'s `FeaturePlugin` interface): nav items,
  context providers, cron tasks, and job-detail-view actions the shell
  needs to know about, if any. A feature with nothing to contribute here
  (e.g. `admin`, `onboarding`) can have a minimal or absent plugin -
  `onboarding` in particular has no `feature.ts` at all and self-gates
  by reading `features.config.ts` directly in its route, since it has
  nothing to register.
- **`features/registry.ts`** imports every feature module that exists,
  and filters to the ones that are both registered AND `enabled` in
  `features.config.ts`. Shared shell code (`SiteHeader`, `RootLayout`,
  the cron route) only ever imports this registry, never a specific
  feature - that's what makes deleting a feature safe (see each
  feature's README's "Deleting this feature" section).

Access control at the route level is a per-feature `app/**/page.tsx`
shim calling either `features/authGuard.ts`'s `checkAccess(featureKey)`
(feature-flag + guest-access) or `requireAdmin()` (role-based, for
`admin`) - see `features/auth/README.md`'s "Notes for other features".

Real cross-feature dependencies exist and aren't hidden: `applications`
reads `job-sync`'s `jobs` table, `job-alerts`' `/preferences` page
renders `onboarding`'s `PreferencesEditor` component, `resume` and
`job-posting` both reuse `lib/storage/`. Check a feature's own README
before assuming it's fully standalone.

## Theming: `theme.config.ts` + `theme.schema.ts` + `app/globals.css` + `styles/presets/*.css`

`theme.config.ts` is the single file to edit for branding - `preset`,
`font`, `radius`, `density`, `defaultMode`. Everything else derives from
it.

- **Design tokens** are CSS custom properties defined once in
  `app/globals.css`'s `html { ... }` block (light mode) and redefined in
  `html.dark { ... }` (dark mode): `--background`, `--foreground`,
  `--card`/`--card-foreground`, `--muted`/`--muted-foreground`,
  `--border`, `--input`/`--input-background`, `--ring`, `--primary`/
  `--primary-foreground`, `--secondary`/`--secondary-foreground`,
  `--destructive`/`--destructive-foreground`, `--accent`/
  `--accent-foreground`, `--warning`/`--warning-foreground`, the
  `--on-primary*`/`--inverse-*` pair (high-contrast controls on top of a
  primary-colored surface), `--switch-thumb`/`--switch-thumb-border`,
  `--overlay` (modal/sheet backdrop, intentionally identical in both
  modes), and `--radius`/`--spacing-card`.
- Tailwind v4's `@theme inline` block (same file) maps every one of
  those to a Tailwind color/radius/spacing token (`--color-background`,
  etc.), which is what makes `bg-background`, `text-primary`,
  `border-border`, `rounded-lg` work as ordinary utility classes. There
  is no `tailwind.config.js` - this is pure Tailwind v4 CSS-first
  config.
- **Presets** (`styles/presets/default.css`, `warm.css`,
  `minimal-mono.css`) override a subset of those same tokens under an
  `html[data-preset="..."]` attribute selector, which `app/layout.tsx`
  sets from `theme.config.ts`'s `preset` value. `preset: "custom"` loads
  no preset at all - use it when you're editing `app/globals.css`'s own
  `html`/`html.dark` blocks directly instead of picking a preset.
- **Fonts**: `app/layout.tsx` loads `Geist`/`Geist_Mono`/`Inter` via
  `next/font/google` and resolves `theme.config.ts`'s `font` choice to a
  `--font-sans` CSS variable set inline on `<html>`. Add a font choice
  by adding the Google Font import, extending `fontVariableByChoice` in
  `layout.tsx`, and adding it to `theme.schema.ts`'s `font` enum.
- **Light/dark mode** is a custom implementation (`components/theme/
  ThemeProvider.tsx`), not `next-themes`: a React context persists the
  user's choice to `localStorage`, and toggles the `.dark` class on
  `<html>`. A synchronous inline `<script>` in `app/layout.tsx`'s
  `<head>` applies that class before first paint to avoid a flash.
  Tailwind's `dark:` variant is wired to that class via `@custom-variant
  dark (&:where(.dark, .dark *));`, not the `prefers-color-scheme`
  media query directly - `defaultMode` only decides the *initial* value
  before any user override.

## Rule: always use design tokens, never a raw color literal

Every component under `components/ui/*` (the shared library) and every
feature's DOM-rendered UI should reference a token - a Tailwind class
like `bg-primary`/`text-muted-foreground`/`border-border`, or (rarely,
for something not expressible as a class) `var(--foreground)` etc. -
never a hardcoded hex value. That's what lets `theme.config.ts` actually
restyle the whole app from one file. `components/ui/*` already holds to
this with zero exceptions; hold new feature code to the same bar.

The known, deliberate exceptions, and why each is exempt:

- **`features/resume/lib/pdf.tsx`** and its colour constants in
  **`features/resume/lib/templates.ts`** (`RESUME_TEMPLATE_COLORS`) -
  `@react-pdf/renderer` renders to PDF primitives, not CSS, so it
  literally cannot consume a CSS custom property. These are also *not*
  meant to track the site's own theme even conceptually - a resume PDF
  gets downloaded and sent to employers, so its template colour
  shouldn't shift because a job board operator picked a different site
  preset. `components/ResumePreview.tsx` (the in-app, DOM-rendered
  preview of the same resume) imports those same constants rather than
  re-deriving its own, so the two renderers can't drift apart from each
  other, even though neither ties into the site's tokens.
- **`app/opengraph-image.tsx`** and **`app/jobs/[id]/opengraph-image.
  tsx`** - built on Satori (`next/og`'s `ImageResponse`), which has the
  same CSS-custom-property limitation as `@react-pdf/renderer`. Their
  hardcoded green happens to match the *default* preset's `--primary`,
  so switching presets will make OG images visibly inconsistent with
  the rest of the site - a known limitation, not a bug to chase.
- **`:root`'s `--brand-*` variables** in `app/globals.css` (LinkedIn/
  Twitter/YouTube/Facebook/Instagram colors) - a brand's colour is
  defined by the brand, not by this app's theme, so these are
  intentionally declared once, outside the light/dark/preset system,
  and never vary.

If you add a new hardcoded-color exception, document why here, the same
way the ones above are documented.
