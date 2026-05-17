# CleanJobData Next.js Job Board Starter

A production-ready, high-performance job board template built with **Next.js 15**, **Tailwind CSS v4**, and the **CleanJobData API**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cleanjobdata/cleanjobdata-nextjs-job-board&env=CLEANJOBDATA_API_URL,CLEANJOBDATA_API_KEY,NEXT_PUBLIC_SITE_NAME&envDescription=CLEANJOBDATA_API_URL&envDescription=CLEANJOBDATA_API_KEY&envDescription=NEXT_PUBLIC_SITE_NAME&project-name=cleanjobdata-job-board)

## Features

- **Modern Stack**: Next.js 15 (App Router), React 19, Tailwind CSS v4.
- **Fast & Scannable**: Optimized job grid with server-side rendering and cursor-based pagination.
- **Advanced Filtering**: Search by title, location (with geo-suggestions), remote, seniority, salary, and more.
- **URL Synchronization**: All filter states are synced to the URL for easy bookmarking and sharing.
- **Side Panel View**: Intercepting routes for a seamless "side view" of job details without losing your place in the list.
- **Responsive Design**: Mobile-first approach with a dedicated filter drawer for smaller screens.
- **Theme Support**: Built-in light and dark mode with zero flash on load.
- **Type Safe**: Strict TypeScript implementation for all API responses and application state.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cleanjobdata/cleanjobdata-nextjs-job-board.git
cd cleanjobdata-nextjs-job-board
```

### 2. Configure environment variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your CleanJobData API credentials:

```bash
CLEANJOBDATA_API_URL=https://api.cleanjobdata.com
CLEANJOBDATA_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_NAME="My Job Board"
```

> **Note**: You can get your API key from the [CleanJobData Dashboard](https://cleanjobdata.com/dashboard).

### 3. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your job board in action.

## Deployment

### Deploy to Vercel

The easiest way to deploy is using the Vercel button at the top of this README. During the import process, Vercel will prompt you to enter the required environment variables.

### Manual Deployment

1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Import the project into Vercel or your preferred hosting provider.
3. Add the environment variables listed in `.env.example`.
4. Deploy!

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
