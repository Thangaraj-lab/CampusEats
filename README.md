# CampusEats

Campus food ordering and pickup management for students, vendors, and administrators.

## Local setup

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

The app runs locally without shared credentials by using an in-memory MongoDB database and test payment fallback. Data is reset when the server stops.

For persistent data or real Razorpay test payments, copy `.env.example` to `.env` and add your own credentials. Never commit `.env` or publish API keys; `.env` is ignored by Git.

## Checks

- `npm run lint` validates TypeScript.
- `npm run build` creates the production bundle.
