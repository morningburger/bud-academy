import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Instructor, OrgType } from "./types";

export interface Viewer {
  userId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  orgType: OrgType | null;
  branch: string | null;
  jobTitle: string | null;
  marketingAgreed: boolean;
  /** 소속·직급까지 모두 입력됨 (수강 신청 가능) */
  profileComplete: boolean;
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
    supabase.from("profiles").select("name, phone, org_type, branch, job_title, marketing_agreed").eq("id", userId).maybeSingle(),
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("instructors").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    userId,
    email: (claims.email as string | undefined) ?? null,
    name: profile?.name ?? null,
    phone: profile?.phone ?? null,
    orgType: (profile?.org_type as OrgType | null) ?? null,
    branch: profile?.branch ?? null,
    jobTitle: profile?.job_title ?? null,
    marketingAgreed: Boolean(profile?.marketing_agreed),
    profileComplete: Boolean(profile?.name && profile?.phone && profile?.org_type && profile?.branch && profile?.job_title),
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
