# Getting Started with CleanJobData Next.js Starter

Follow these steps to get your job board up and running in less than 5 minutes.

## 1. Create a CleanJobData Account
If you haven't already, sign up for a free account at [cleanjobdata.com/signup](https://cleanjobdata.com/signup).

## 2. Generate an API Key
Go to your [Dashboard](https://cleanjobdata.com/dashboard#api-keys) and create a new API key. You'll need this to fetch job data.

## 3. Deploy to Your Favorite Platform

### One-Click Deploy (Recommended)
The fastest way to get started is using our one-click deploy buttons on the [Template Detail Page](https://cleanjobdata.com/templates/frameworks/nextjs-starter).

- **Vercel**: Click the "Deploy to Vercel" button. It will prompt you for your API key and site name.
- **Netlify**: Click the "Deploy to Netlify" button to clone and deploy instantly.

### Manual Setup (Local Development)
1. **Clone the repo**:
   ```bash
   git clone https://github.com/CleanJobData/nextjs-job-board-starter.git
   cd nextjs-job-board-starter
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env.local` file and add:
   ```bash
   CLEANJOBDATA_API_URL=https://api.cleanjobdata.com
   CLEANJOBDATA_API_KEY=your_api_key_here
   NEXT_PUBLIC_SITE_NAME="My Job Board"
   ```
4. **Run the app**:
   ```bash
   npm run dev
   ```

## 4. Turn On More Than Job Listings (optional)

The steps above get you a jobs-listing-only board with no database. This
template also has accounts, resumes, applications tracking, self-service
job posting, an admin dashboard, and email alerts - each is its own
switch in `features.config.ts` and needs Postgres (some need one more
service on top, like file storage or an email provider). See the main
[README](../README.md)'s "Optional features" table and "Full setup"
section for the complete walkthrough, or jump straight to a feature's own
README under `features/<name>/README.md`.

## 5. Customize Your Board

### Branding
- **Logo**: Replace `public/logo.svg` with your own logo.
- **Icon**: Update `app/icon.svg` for the favicon.
- **Site Name**: Change `NEXT_PUBLIC_SITE_NAME` in your environment variables.

### Styling
The template uses **Tailwind CSS v4** with a token-based theming system.
Edit `theme.config.ts` first (color preset, font, corner radius, spacing
density, default light/dark mode) - it's designed to be the one file you
touch for most rebranding. For a fully custom palette beyond the built-in
presets, set `preset: "custom"` there and edit the token values directly
in `app/globals.css`. See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for how
it all fits together.

### SEO
Update the metadata in `app/layout.tsx` to match your brand. Make sure to set `NEXT_PUBLIC_APP_URL` in production for correct social previews.

## 6. Need Help?
Check out our [API Documentation](https://api.cleanjobdata.com/docs) or reach out to us at [cleanjobdata.com/support](https://cleanjobdata.com/support).
