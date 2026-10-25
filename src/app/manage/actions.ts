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
    track: str(form, "track") || "etc",
    level: str(form, "level") ? Number(str(form, "level")) : null,
    schedule_summary: strOrNull(form, "schedule_summary"),
    eligibility: strOrNull(form, "eligibility"),
    price_note: strOrNull(form, "price_note"),
    curriculum: str(form, "curriculum")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...rest] = line.split("|");
        const detail = rest.join("|").trim();
        return detail ? { title: title.trim(), detail } : { title: title.trim() };
      }),
    materials: str(form, "materials").split("\n").map((l) => l.trim()).filter(Boolean),
    format: str(form, "format") || "offline",
    location: strOrNull(form, "location"),
    price: priceRaw === "" ? null : Number(priceRaw),
    internal_only: form.get("internal_only") === "on",
    cancel_deadline_days: Math.min(60, Math.max(0, Number(str(form, "cancel_deadline_days") || 7) || 0)),
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
    apply_deadline: strOrNull(form, "apply_deadline"),
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
  revalidatePath("/admin", "layout");
  return { ok: "처리했어요." };
}

/** 수강생 취소 요청 처리: approve → 취소, reject → 요청 거절(확정 유지) */
export async function resolveCancel(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = str(form, "id");
  const approve = str(form, "decision") === "approve";
  const { error } = await supabase
    .from("enrollments")
    .update(approve ? { status: "canceled" } : { cancel_requested_at: null, cancel_reason: null })
    .eq("id", id)
    .eq("status", "approved");
  if (error) return { error: dbError(error.message) };
  revalidatePath("/manage", "layout");
  revalidatePath("/admin", "layout");
  return { ok: approve ? "취소했어요." : "취소 요청을 거절했어요." };
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
    affiliation: str(form, "team") ? "gohair" : "external",
    team: ["director", "trend", "education"].includes(str(form, "team")) ? str(form, "team") : null,
    status: "approved",
    user_id: null,
  });
  if (error) return { error: dbError(error.message) };
  revalidatePath("/", "layout");
  return { ok: `${name} 강사를 등록했어요.` };
}

/* ── 강사진 (관리자) ── */
export async function addLineup(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "관리자만 할 수 있어요." };
  const courseId = str(form, "course_id");
  const instructorId = str(form, "instructor_id");
  if (!instructorId) return { error: "강사를 골라 주세요." };
  const supabase = await createClient();
  const { count } = await supabase.from("course_instructors").select("course_id", { count: "exact", head: true }).eq("course_id", courseId);
  const { error } = await supabase.from("course_instructors").insert({
    course_id: courseId,
    instructor_id: instructorId,
    role: strOrNull(form, "role"),
    position: (count ?? 0) + 1,
  });
  if (error) return { error: error.code === "23505" ? "이미 강사진에 있어요." : "추가하지 못했어요." };
  revalidatePath("/", "layout");
  return { ok: "강사진에 추가했어요." };
}

export async function updateLineup(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const supabase = await createClient();
  const position = Number(str(form, "position"));
  await supabase
    .from("course_instructors")
    .update({ role: strOrNull(form, "role"), ...(Number.isFinite(position) ? { position } : {}) })
    .eq("course_id", str(form, "course_id"))
    .eq("instructor_id", str(form, "instructor_id"));
  revalidatePath("/", "layout");
}

export async function removeLineup(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const supabase = await createClient();
  await supabase.from("course_instructors").delete()
    .eq("course_id", str(form, "course_id"))
    .eq("instructor_id", str(form, "instructor_id"));
  revalidatePath("/", "layout");
}

/* ── 상세 이미지 ── */
export async function addGalleryImages(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };
  const courseId = str(form, "course_id");
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "올릴 이미지를 골라 주세요." };
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > 4 * 1024 * 1024) return { error: "한 번에 4MB까지 올릴 수 있어요. 나눠서 올려 주세요." };
  const supabase = await createClient();
  const urls: string[] = [];
  try {
    for (const f of files) {
      const url = await uploadImage(supabase, viewer.userId, f, "gallery");
      if (url) urls.push(url);
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { data: course } = await supabase.from("courses").select("gallery").eq("id", courseId).maybeSingle();
  if (!course) return { error: "강좌를 찾을 수 없어요." };
  const { error } = await supabase.from("courses").update({ gallery: [...(course.gallery ?? []), ...urls] }).eq("id", courseId);
  if (error) return { error: dbError(error.message) };
  revalidatePath("/", "layout");
  return { ok: `${urls.length}장을 추가했어요.` };
}

export async function updateGallery(form: FormData) {
  const supabase = await createClient();
  const courseId = str(form, "course_id");
  const url = str(form, "url");
  const op = str(form, "op"); // remove | up | down | cover
  const { data: course } = await supabase.from("courses").select("gallery, thumbnail_url").eq("id", courseId).maybeSingle();
  if (!course) return;
  const list: string[] = [...(course.gallery ?? [])];
  const i = list.indexOf(url);
  if (op === "cover") {
    await supabase.from("courses").update({ thumbnail_url: url }).eq("id", courseId);
  } else if (i >= 0) {
    if (op === "remove") list.splice(i, 1);
    if (op === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
    if (op === "down" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
    await supabase.from("courses").update({ gallery: list }).eq("id", courseId);
  }
  revalidatePath("/", "layout");
}
