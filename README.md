<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio project

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9c1ffcf8-dd8b-47b2-b473-5f8345ba9ccf

## Run Locally

**Prerequisites:**  Node.js


1. Set up dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Abuse protection setup

The app now uses Firebase App Check, rate-limited callable writes, Cloudflare Turnstile, crawler exclusions, and Vercel security headers.

Add these Vite variables in Vercel and `.env.local` for local testing:

```text
VITE_FIREBASE_APPCHECK_SITE_KEY=your-reCAPTCHA-Enterprise-site-key
# Or use this instead for reCAPTCHA v3:
# VITE_RECAPTCHA_SITE_KEY=your-reCAPTCHA-v3-site-key
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

Manual console steps:

1. In Firebase Console, register `manhwa24.xyz` under App Check for the web app, choose reCAPTCHA Enterprise (preferred) or v3, then enable enforcement for Firestore and Cloud Functions after testing. The site key goes in `VITE_FIREBASE_APPCHECK_SITE_KEY` or `VITE_RECAPTCHA_SITE_KEY`.
2. In Cloudflare Turnstile, create a widget for `manhwa24.xyz` and add its site key to `VITE_TURNSTILE_SITE_KEY`. Store the secret in Vercel as `TURNSTILE_SECRET_KEY` and in Firebase Functions with `firebase functions:secrets:set TURNSTILE_SECRET_KEY`, then redeploy both.
3. Deploy Functions from the `functions` directory with `npm run build` followed by your normal Firebase deploy command. `protectedWrite` enforces App Check, CAPTCHA, authentication/creator authorization, and atomic Firestore counters for comments, posts, reports, and series submissions.
4. Review the CSP in `vercel.json` when adding third-party analytics or media hosts. The policy intentionally allows HTTPS media and Firebase connections but blocks framing and unknown scripts.
