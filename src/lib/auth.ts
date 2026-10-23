import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Instructor } from "./types";

export interface Viewer {
  userId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
  instructor: Instructor | null;
}

/** 요청당 한 번만 조회. 서명이 검증된 토큰(getClaims) 기준 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const userId = claims.sub;

  const [{ data: profile }, { data: admin }, { data: instructor }] = await Promise.all([
    supabase.from("profiles").select("name, phone").eq("id", userId).maybeSingle(),
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("instructors").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    userId,
    email: (claims.email as string | undefined) ?? null,
    name: profile?.name ?? null,
    phone: profile?.phone ?? null,
    isAdmin: Boolean(admin),
    instructor: (instructor as Instructor | null) ?? null,
  };
});

export async function requireViewer(next = "/") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireViewer("/admin");
  if (!viewer.isAdmin) redirect("/");
  return viewer;
}

export async function requireApprovedInstructor() {
  const viewer = await requireViewer("/studio");
  if (!viewer.instructor) redirect("/partner");
  return viewer as Viewer & { instructor: Instructor };
}
