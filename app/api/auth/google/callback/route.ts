import { exchangeAndStore } from "@/lib/google";

export const dynamic = "force-dynamic";

const app = () => process.env.APP_URL ?? "http://localhost:3000";

// GET /api/auth/google/callback?code=... → store tokens, back to home
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return Response.redirect(`${app()}/?google=error`);
  try {
    await exchangeAndStore(code);
    return Response.redirect(`${app()}/?google=connected`);
  } catch (e) {
    console.error("google callback failed:", e);
    return Response.redirect(`${app()}/?google=error`);
  }
}
