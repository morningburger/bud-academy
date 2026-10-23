"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export async function updateSuggestion(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const status = String(form.get("status") ?? "");
  const fields: Record<string, string | null> = {};
  if (["new", "read", "done"].includes(status)) fields.status = status;
  if (form.has("admin_note")) fields.admin_note = String(form.get("admin_note") ?? "").trim().slice(0, 1000) || null;
  const supabase = await createClient();
  await supabase.from("suggestions").update(fields).eq("id", String(form.get("id") ?? ""));
  revalidatePath("/admin", "layout");
}
