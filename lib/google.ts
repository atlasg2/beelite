import { google } from "googleapis";
import { db } from "@/lib/db";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // create + manage only files this app makes
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT
  );
}

export function authUrl() {
  return oauthClient().generateAuthUrl({
    access_type: "offline", // get a refresh token
    prompt: "consent", // force refresh token even on re-connect
    scope: SCOPES,
  });
}

/** Exchange the callback code for tokens and store the connection (single row). */
export async function exchangeAndStore(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email: string | undefined;
  try {
    const me = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
    email = me.data.email ?? undefined;
  } catch {
    /* email is best-effort */
  }

  const existing = await db.googleConnection.findFirst();
  const data = {
    email,
    refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? "",
    accessToken: tokens.access_token ?? null,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
  if (existing) await db.googleConnection.update({ where: { id: existing.id }, data });
  else await db.googleConnection.create({ data });
}

export async function getConnection() {
  return db.googleConnection.findFirst();
}

/** An OAuth2 client authed as the connected user (auto-refreshes), or null if not connected. */
export async function getAuthedClient() {
  const conn = await db.googleConnection.findFirst();
  if (!conn?.refreshToken) return null;
  const client = oauthClient();
  client.setCredentials({ refresh_token: conn.refreshToken });
  return client;
}

export async function disconnectGoogle() {
  await db.googleConnection.deleteMany({});
}
