# resume

Upload a PDF resume and have it parsed into an editable, structured
record, or build one from scratch - either way you get a live in-app
preview, an ATS-friendliness check of the *uploaded file*, and a
downloadable PDF export in your choice of template.

## Config (`features.config.ts` -> `resume`)

- `enabled` - turn the whole feature on/off.
- `guestAccess` - hard-typed `false` in `features.schema.ts`: a resume is
  inherently an authenticated user's own data, same reasoning as
  `applications`.
- `parsing` - run the heuristic text parser (`lib/parse.ts`) over an
  uploaded PDF's extracted text to pre-fill the editable draft. Off means
  an upload is stored with empty fields for manual entry.
- `aiParsing` - use Anthropic (Claude Haiku) instead of the heuristic
  parser, when both this flag AND `ANTHROPIC_API_KEY` are set. Falls back
  to the heuristic parser automatically if the key is missing or the API
  call fails (`lib/ai-parse.ts` never throws) - so flipping this on with
  no key configured is safe, not a broken deploy.

## Env vars

- `ANTHROPIC_API_KEY` - optional. Only used when `aiParsing: true`.
- Storage (`lib/storage/`) - required once anyone uploads a PDF. Same
  vars as `job-posting` reuses for logos:
  - `STORAGE_PROVIDER` (`local` default, or `s3`)
  - If `s3`: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
    `S3_SECRET_ACCESS_KEY`, optionally `S3_ENDPOINT`/`S3_PUBLIC_URL_BASE`.
  - `local` writes to a gitignored `uploads/` dir - fine for a persistent-
    disk self-hosted deployment, **not** for serverless/Vercel (the
    filesystem a function writes to doesn't survive past that
    invocation). Set `STORAGE_PROVIDER=s3` for any serverless deploy - see
    `lib/storage/README.md`.

## Routes

- `/resume` - list of the signed-in user's resumes (upload/create/delete,
  set-default).
- `/resume/[id]` - read-only preview, ATS report (if the resume was
  uploaded), and template picker's live effect.
- `/resume/[id]/edit` - the structured editor (contact, summary,
  experience, education, projects, skills, freeform "additional
  sections" for things like certifications/languages).
- `/api/resume/[id]/pdf` - streams a generated PDF of the structured
  content in the resume's chosen template.

## The two parsers, and why they don't share code

`lib/parse.ts` (heuristic, always available) and `lib/ai-parse.ts`
(optional, Anthropic-backed) both fill the *editable draft* the builder
starts from - lenient by design, since a human reviews and corrects
whatever they produce.

`lib/ats.ts` (the ATS-friendliness checker, only runs on an uploaded PDF)
is a **separate, independent implementation** of "what field can be
recovered from this text," not a caller of either parser above. Reusing
the builder's lenient parser for the checker would mean every gap in the
report was really a report card on the builder's implementation, not
evidence about the resume - see `lib/ats.ts`'s own comment above its
field-recovery checks for the full reasoning. If you're extending this
feature, don't wire the two together.

## PDF templates

`lib/templates.ts` lists the four templates (`Classic`/`Banner`/
`Executive`/`Sidebar`) and each one's `atsSafe` flag. `Classic`,
`Banner`, and `Executive` stay single-column/one-font by construction -
the same properties `lib/ats.ts`'s own checks score a resume on. `Sidebar`
is a genuine two-column layout and is explicitly flagged `atsSafe: false`
- the editor's template picker shows a warning on it rather than
pretending it's fine. `lib/pdf.tsx` (the downloadable PDF, via
`@react-pdf/renderer`) and `components/ResumePreview.tsx` (the in-app
preview) are two independent renderers sharing one `ResumeContent` shape
and one small markdown parser (`lib/markdown.ts`) - see that file's
comment for why a library like `react-markdown` wasn't used (it can't
feed `@react-pdf/renderer`'s primitives).

## DB

`resumes` table (`db/schema.ts`): `content` (JSONB, the `ResumeContent`
shape), `atsReport` (JSONB, null for a from-scratch resume with no
uploaded file to analyse), `template`, `rawText` (kept even after
parsing, so a future parser improvement can be re-run over an existing
upload without asking anyone to re-upload), plus `isDefault`/`source`.

## Deleting this feature

Remove `app/(dashboard)/resume/`, `app/api/resume/`, this folder, the
`resume` entry from `features.schema.ts`/`features.config.ts`, the
`resumeFeature` import/entry in `features/registry.ts`, and the
`export * from "@/features/resume/db/schema"` line in `lib/db/schema.ts`.
Then `npm uninstall @react-pdf/renderer` (and `@anthropic-ai/sdk` if
nothing else in your deployment uses it).
