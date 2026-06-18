"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const VALID = ["new", "saved", "dismissed"] as const;
type LeadStatus = (typeof VALID)[number];

// Triage a permit lead. Invoked from inline <form action={setLeadStatus}> buttons on /permits, so it
// reads the permit id + target status from FormData and re-renders the current view via revalidate.
export async function setLeadStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !VALID.includes(status as LeadStatus)) return;

  await db.nolaPermit.update({
    where: { id },
    data: { leadStatus: status, leadUpdatedAt: new Date() },
  });
  revalidatePath("/permits");
}
