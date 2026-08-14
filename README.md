# Logistics Management School

Interactive learning and management system for Wildberries logistics, built
around a fictional company ("Upsell") that ships goods from Kyrgyzstan into
Russia and sells through FBS/FBW on Wildberries.

Live: https://logistics-six-tau.vercel.app

## What's inside

- 21 modules covering fundamentals, FBS vs FBW, economics, packaging,
  warehousing, inventory, distribution, localization, returns, transportation,
  cross-border cargo (Kyrgyzstan → Russia), decision engines, alerts,
  analytics scenarios, crisis management, and strategy — each with concept
  explanations, interactive calculators, cases, quizzes, and manager
  questions.
- A director's dashboard, a "Manager Mode" scenario trainer, and a first-pass
  30-day capstone simulation.
- A shared calculation engine (`src/lib/formulas.ts`) and a separate,
  clearly-dated tariff configuration layer (`src/data/tariffs.ts`) — tariff
  numbers are illustrative training values, not live Wildberries rates.

## Stack

React + TypeScript + Vite + Tailwind v4, client-side only (no backend).
Progress is stored in the browser's `localStorage`.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Deployment

Deployed on Vercel, auto-deploying from `main` on every push.
