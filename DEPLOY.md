# Deploying

The site is on Vercel (team **eliteinstall**, project **beelite**).
Production URL: https://beelite-eliteinstall.vercel.app

## Deploy

```bash
npm run deploy
```

That's it. The script (`scripts/deploy.sh`) runs everything in order and stops
on the first failure:

1. **Type-check** (`tsc --noEmit`) — catches errors `next dev` ignores.
2. **Clean local build** — if it can't build here, we don't ship it.
3. **Force deploy** to production — `--force` so a stale build cache can never
   serve old code.
4. **Verify** — confirms the live homepage is serving the CSS hash from the
   build you just made, so "did it actually update?" is answered automatically.

## First-time setup on a new machine

The Vercel token lives in `.vercel.token` (git-ignored). Create it with:

```bash
echo 'VERCEL_TOKEN=vcp_xxx' > .vercel.token && chmod 600 .vercel.token
```

## Gotchas this setup prevents

- **"I deployed but it looks the same."** Usually a stale build cache or the
  CDN. The verify step catches both — it fails loudly instead of you guessing.
- **Build fails only on Vercel.** `next dev` skips type-checking and lint;
  the local build step reproduces Vercel's strict build before we upload.
- **Dev server breaks after `npm install`.** A running `next dev` holds the old
  `node_modules`. After installing/upgrading anything, restart it:
  ```bash
  pkill -f "next dev"; npm run dev
  ```
