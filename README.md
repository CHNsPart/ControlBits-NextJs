This is the ControlBits frontend, a calm habit tracker built with Next.js.

## Getting Started
First, install all the requirements:
```
npm install
```
Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Tech Stack

- Next.js + React
- TypeScript
- Tailwind CSS
- Framer Motion

## Using the App

- Sign up or sign in.
- Create habits, then mark them **Completed** or **Missed** on the dashboard.
- Use **Archive** to hide inactive habits (archived habits are listed in the dashboard).
- Habit details show calendar history, streaks, and recent activity.

## API Configuration

By default the app talks to `http://localhost:8080/api/v1`. To point elsewhere:

```bash
export NEXT_PUBLIC_API_BASE="http://localhost:8080/api/v1"
```

Or create `ControlBits-NextJs/.env.local`:

```bash
NEXT_PUBLIC_API_BASE="http://localhost:8080/api/v1"
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
