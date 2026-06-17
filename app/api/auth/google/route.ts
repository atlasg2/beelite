import { authUrl } from "@/lib/google";

export const dynamic = "force-dynamic";

// GET /api/auth/google → send the user to Google's consent screen
export function GET() {
  return Response.redirect(authUrl());
}
