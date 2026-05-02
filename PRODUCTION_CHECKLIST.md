# Production Checklist

## Required Before Deploy

- Set all Firebase public environment variables from `.env.example`.
- Set `FIREBASE_ADMIN_SDK_KEY` as raw JSON or base64-encoded service account JSON.
- Set `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_AI_API_KEY`.
- Set `NEXT_PUBLIC_DISABLE_TRIAL_MODE=true`.
- Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS URL.
- Set `CRON_SECRET` before enabling scheduled compliance checks.
- Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` before enabling email delivery.
- Set `NEWS_API_KEY` if the news API is expected to work in production.

## Verification Commands

```bash
npm run verify
npm run build
```

For one command:

```bash
npm run verify:prod
```

With a local server running, smoke-test the role route surfaces:

```bash
npm run build
npm run preview
npm run qa:routes
npm run qa:api-auth
```

Or run both smoke checks:

```bash
npm run qa:all
```

Run real Firebase role QA separately because it writes temporary users and records into the configured Firebase project:

```bash
npm run qa:firebase-roles
npm run qa:browser-roles
```

## Firebase Deploy

Deploy Firestore rules and indexes after the app build is green:

```bash
firebase login --reauth
firebase deploy --only firestore:rules,firestore:indexes --project smart-medication-centre
```

This repository is pinned to the default Firebase project in `.firebaserc`:

```json
{
  "projects": {
    "default": "smart-medication-centre"
  }
}
```

If Firebase CLI credentials expire locally, run `firebase login --reauth` and repeat the deploy command. The deploy cannot be completed by automation until that browser reauth is finished.

## Current Launch Blockers

- Firebase CLI reauth is required before deploying Firestore rules/indexes.
- Set `NEXT_PUBLIC_APP_URL` to the final deployed HTTPS URL.
- Set `NEXT_PUBLIC_DISABLE_TRIAL_MODE=true` in the production hosting environment.
- Set `RESEND_FROM_EMAIL` before enabling production email sending.
- Set `CRON_SECRET` before enabling scheduled compliance checks.

## Manual QA Matrix

- Admin: users, documents, requests, audit logs, announcements, reports.
- Clinic: onboarding, profile update, ERP records, staff, inventory, equipment, appointments, compliance, shifts.
- Doctor: onboarding, documents, forum, jobs, messages, surveys/vaccinations visibility.
- Patient: onboarding, appointments, messages, surveys, vaccinations, forum/jobs.

The route and API auth smoke tests do not replace manual QA with real Firebase users. They verify route availability, server health, security headers, and unauthenticated API rejection; `npm run qa:firebase-roles` covers representative API workflows with real Firebase ID tokens, and each role still needs a browser login pass before client delivery.
Run the smoke tests against `npm run preview` rather than `npm run dev` for the most stable production-like result.

## Production Risk Notes

- RAG is intentionally not finalized until the client provides approved content/data sources.
- Email and scheduled compliance checks depend on `RESEND_*` and `CRON_SECRET`.
- The current app is API-gated and Firestore writes are locked down, but it still needs role-by-role QA with real Firebase users before client delivery.
