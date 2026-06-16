// Diagnostic: what can the service account actually do?
import { google } from "googleapis";

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json",
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });

  try {
    const about = await drive.about.get({ fields: "storageQuota,user" });
    console.log("storageQuota:", JSON.stringify(about.data.storageQuota));
    console.log("user:", JSON.stringify(about.data.user));
  } catch (e: any) {
    console.log("about error:", e?.response?.data?.error?.message ?? e.message);
  }

  try {
    const f = await drive.files.create({
      requestBody: { name: "beelite-test", mimeType: "application/vnd.google-apps.spreadsheet" },
      fields: "id",
    });
    console.log("CREATE OK, id:", f.data.id);
    await drive.files.delete({ fileId: f.data.id! });
    console.log("(cleaned up)");
  } catch (e: any) {
    const err = e?.response?.data?.error;
    console.log("CREATE error:", err?.code, err?.message, "| reason:", err?.errors?.[0]?.reason);
  }
}
main();
