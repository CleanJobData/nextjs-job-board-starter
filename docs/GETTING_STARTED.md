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

## 4. Customize Your Board

### Branding
- **Logo**: Replace `public/logo.svg` with your own logo.
- **Icon**: Update `app/icon.svg` for the favicon.
- **Site Name**: Change `NEXT_PUBLIC_SITE_NAME` in your environment variables.

### Styling
The template uses **Tailwind CSS v4**. You can customize the theme by editing `app/globals.css`.

### SEO
Update the metadata in `app/layout.tsx` to match your brand. Make sure to set `NEXT_PUBLIC_APP_URL` in production for correct social previews.

## 5. Need Help?
Check out our [API Documentation](https://api.cleanjobdata.com/docs) or reach out to us at [cleanjobdata.com/support](https://cleanjobdata.com/support).
