"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

export type ActionState = { error?: string; ok?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const strOrNull = (f: FormData, k: string) => str(f, k) || null;

function dbError(message: string | undefined) {
  if (message?.includes("바꿀 수 없습니다") || message?.includes("정원") || message?.includes("회차")) return message;
  return "저장하지 못했어요. 권한이나 입력값을 확인해 주세요.";
}

export async function saveCourse(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };
  const supabase = await createClient();

  const id = strOrNull(form, "id");
  const title = str(form, "title");
  if (!title) return { error: "강좌 이름을 입력해 주세요." };
  const priceRaw = str(form, "price").replace(/[^0-9]/g, "");

  let thumbnail_url: string | null = null;
  try {
    thumbnail_url = await uploadImage(supabase, viewer.userId, form.get("thumbnail"), "course");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const fields: Record<string, unknown> = {
    title,
    summary: strOrNull(form, "summary"),
    description: strOrNull(form, "description"),
    audience: strOrNull(form, "audience"),
    category: str(form, "category") || "etc",
    format: str(form, "format") || "offline",
    location: strOrNull(form, "location"),
    price: priceRaw === "" ? null : Number(priceRaw),
    ...(thumbnail_url ? { thumbnail_url } : {}),
  };

  if (viewer.isAdmin) {
    const seller = str(form, "seller");
    if (seller) {
      fields.is_official = seller === "official";
      fields.instructor_id = seller === "official" ? null : seller;
    }
  }

  const submitTo = str(form, "intent"); // "draft" | "review"
  let courseId = id;

  if (id) {
    const { error } = await supabase.from("courses").update(fields).eq("id", id);
    if (error) return { error: dbError(error.message) };
  } else {
    if (!viewer.isAdmin) {
      if (viewer.instructor?.status !== "approved") return { error: "승인된 강사만 강좌를 열 수 있어요." };
      fields.instructor_id = viewer.instructor.id;
    }
    fields.status = viewer.isAdmin ? "draft" : submitTo === "review" ? "pending_review" : "draft";
    const { data, error } = await supabase.from("courses").insert(fields).select("id").single();
    if (error) return { error: dbError(error.message) };
    courseId = data.id;
  }

  if (id && submitTo === "review") {
    const { error } = await supabase.from("courses").update({ status: "pending_review" }).eq("id", id);
    if (error) return { error: dbError(error.message) };
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/manage/courses/${courseId}`);
  return { ok: "저장했어요." };
}

export async function setCourseStatus(form: FormData) {
  const supabase = await createClient();
  const id = str(form, "id");
  const status = str(form, "status");
  const review_note = form.has("review_note") ? strOrNull(form, "review_note") : undefined;
  await supabase
    .from("courses")
    .update({ status, ...(review_note !== undefined ? { review_note } : {}) })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function saveSession(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = strOrNull(form, "id");
  const capacityRaw = str(form, "capacity").replace(/[^0-9]/g, "");
  const fields = {
    course_id: str(form, "course_id"),
    label: str(form, "label"),
    starts_on: strOrNull(form, "starts_on"),
    ends_on: strOrNull(form, "ends_on"),
    schedule_text: strOrNull(form, "schedule_text"),
    location: strOrNull(form, "location"),
    capacity: capacityRaw ? Number(capacityRaw) : null,
    status: str(form, "status") || "open",
  };
  if (!fields.label) return { error: "회차 이름을 입력해 주세요. 예: 12기" };
  if (fields.starts_on && fields.ends_on && fields.ends_on < fields.starts_on) {
    return { error: "종료일이 시작일보다 빨라요." };
  }
  const { error } = id
    ? await supabase.from("course_sessions").update(fields).eq("id", id)
    : await supabase.from("course_sessions").insert(fields);
  if (error) return { error: dbError(error.message) };
  revalidatePath(`/manage/courses/${fields.course_id}`);
  revalidatePath(`/courses/${fields.course_id}`);
  return { ok: id ? "회차를 고쳤어요." : "회차를 추가했어요." };
}

export async function deleteSession(form: FormData) {
  const supabase = await createClient();
  const courseId = str(form, "course_id");
  await supabase.from("course_sessions").delete().eq("id", str(form, "id"));
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function setEnrollmentStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status: str(form, "status") })
    .eq("id", str(form, "id"));
  if (error) return { error: dbError(error.message) };
  revalidatePath("/manage", "layout");
  revalidatePath("/admin");
  return { ok: "처리했어요." };
}

export async function reviewInstructor(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const supabase = await createClient();
  const id = str(form, "id");
  const status = str(form, "status");
  const affiliation = str(form, "affiliation");
  const commission = str(form, "commission_rate");
  await supabase
    .from("instructors")
    .update({ ...(status ? { status } : {}), ...(affiliation ? { affiliation } : {}) })
    .eq("id", id);
  await supabase
    .from("instructor_settings")
    .update({
      ...(commission !== "" ? { commission_rate: Number(commission) } : {}),
      ...(form.has("review_note") ? { review_note: strOrNull(form, "review_note") } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("instructor_id", id);
  revalidatePath("/", "layout");
}

/** 관리자: 계정 없이 강사 등록 (소속 디자이너를 먼저 올려두고 나중에 계정 연결) */
export async function createInstructorByAdmin(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "관리자만 할 수 있어요." };
  const name = str(form, "name");
  if (!name) return { error: "이름을 입력해 주세요." };
  const supabase = await createClient();
  const { error } = await supabase.from("instructors").insert({
    name,
    headline: strOrNull(form, "headline"),
    branch_name: strOrNull(form, "branch_name"),
    affiliation: str(form, "affiliation") || "gohair",
    status: "approved",
    user_id: null,
  });
  if (error) return { error: dbError(error.message) };
  revalidatePath("/", "layout");
  return { ok: `${name} 강사를 등록했어요.` };
}
