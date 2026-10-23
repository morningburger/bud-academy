"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelEnrollment(form: FormData) {
  const id = String(form.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("enrollments").update({ status: "canceled" }).eq("id", id).eq("status", "requested");
  revalidatePath("/me");
}
