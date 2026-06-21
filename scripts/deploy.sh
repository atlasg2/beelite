#!/usr/bin/env bash
#
# Fast production deploy for the Elite Installation Services site.
#
#   npm run deploy
#
# Optimised for speed:
#   1. Type-check only (catches the errors that actually break the prod build;
#      no slow local rebuild — Vercel builds remotely anyway)
#   2. Deploy to production WITH Vercel's build cache (no --force)
#   3. Verify the production alias is serving the deployment we just made,
#      by matching its main CSS hash
#
# For a paranoid full local build before shipping, run:  npm run preflight
#
set -euo pipefail
cd "$(dirname "$0")/.."

SCOPE="eliteinstall"
ALIAS="https://beelite-eliteinstall.vercel.app"

if [ -f .vercel.token ]; then set -a; . ./.vercel.token; set +a; fi
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "✗ VERCEL_TOKEN not set (put it in .vercel.token)." >&2
  exit 1
fi

echo "▶ 1/3  Type-checking…"
# Drop Next's generated route types — stale entries for deleted routes would
# otherwise fail tsc. They're regenerated on the next build/dev run.
rm -rf .next/types 2>/dev/null || true
npm run typecheck

echo "▶ 2/3  Deploying to production…"
OUT="$(npx vercel deploy --prod --yes --scope "$SCOPE" --token "$VERCEL_TOKEN" 2>&1)"
DEPLOY_URL="$(echo "$OUT" | grep -oE 'https://beelite-[a-z0-9]+-eliteinstall\.vercel\.app' | head -1)"
if [ -z "$DEPLOY_URL" ]; then
  echo "$OUT" | tail -20
  echo "✗ Could not find the deployment URL — see output above." >&2
  exit 1
fi
echo "        deployed: $DEPLOY_URL"

echo "▶ 3/3  Verifying the alias serves this build…"
# The deployment's own main CSS hash is the fingerprint of this exact build.
NEW_CSS="$(curl -s "$DEPLOY_URL/" | grep -oE 'static/css/[a-f0-9]+\.css' | sort -u | tail -1)"
for i in 1 2 3 4 5 6; do
  if curl -s "$ALIAS/" | grep -q "$NEW_CSS"; then
    echo "✅ Live and serving the build you just made."
    echo "   $ALIAS"
    exit 0
  fi
  sleep 4
done

echo "⚠️  Deployed OK, but $ALIAS isn't serving $NEW_CSS yet (CDN propagating)."
echo "   It should appear within a minute: $ALIAS"
exit 0
