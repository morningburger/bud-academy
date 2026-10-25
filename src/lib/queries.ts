import { createClient } from "./supabase/server";
import type { CourseSession, CourseWithInstructor, Instructor, Notice } from "./types";

const COURSE_SELECT =
  "*, instructor:instructors!courses_instructor_id_fkey(*), lineup:course_instructors(role, position, instructor:instructors(id, name, headline, photo_url, affiliation, branch_name))";

function sortLineup<T extends CourseWithInstructor>(c: T): T {
  return { ...c, lineup: [...(c.lineup ?? [])].filter((l) => l.instructor).sort((a, b) => a.position - b.position) };
}

export async function listPublicCourses(track?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("courses")
    .select(COURSE_SELECT)
    .in("status", ["published", "closed"])
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (track) q = q.eq("track", track);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as CourseWithInstructor[]).map(sortLineup);
}

export async function getCourse(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select(COURSE_SELECT).eq("id", id).maybeSingle();
  return data ? sortLineup(data as CourseWithInstructor) : null;
}

export async function listSessions(courseId: string) {
  const supabase = await createClient();
  const [{ data: sessions }, { data: seats }] = await Promise.all([
    supabase
      .from("course_sessions")
      .select("*")
      .eq("course_id", courseId)
      .neq("status", "canceled")
      .order("starts_on", { ascending: true, nullsFirst: false })
      .order("label", { ascending: true }),
    supabase.rpc("session_seats", { p_course_id: courseId }),
  ]);
  const taken = new Map<string, number>(
    ((seats ?? []) as { session_id: string; taken: number }[]).map((s) => [s.session_id, s.taken]),
  );
  return ((sessions ?? []) as CourseSession[]).map((s) => ({ ...s, taken: taken.get(s.id) ?? 0 }));
}

/** 홈 화면: 앞으로 시작하는 회차 */
export async function listUpcomingSessions(limit = 6) {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const { data } = await supabase
    .from("course_sessions")
    .select("*, course:courses!inner(id, title, track, is_official, format, status, thumbnail_url, price)")
    .eq("status", "open")
    .eq("course.status", "published")
    .gte("starts_on", today)
    .order("starts_on", { ascending: true })
    .limit(limit);
  return (data ?? []) as (CourseSession & {
    course: { id: string; title: string; track: string; is_official: boolean; format: string;
      thumbnail_url: string | null; price: number | null };
  })[];
}

/** 홈 화면 단계별 로드맵 */
export async function listLevelCourses() {
  const all = await listPublicCourses("level");
  return all.filter((c) => c.level !== null).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
}

export async function listApprovedInstructors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("*")
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("approved_at", { ascending: true });
  return (data ?? []) as Instructor[];
}

export async function getInstructor(id: string) {
  const supabase = await createClient();
  const [{ data: instructor }, { data: own }, { data: teaching }] = await Promise.all([
    supabase.from("instructors").select("*").eq("id", id).maybeSingle(),
    supabase.from("courses").select(COURSE_SELECT).eq("instructor_id", id).in("status", ["published", "closed"]),
    supabase.from("course_instructors").select("course_id").eq("instructor_id", id),
  ]);
  const extraIds = ((teaching ?? []) as { course_id: string }[]).map((t) => t.course_id);
  let extra: CourseWithInstructor[] = [];
  if (extraIds.length) {
    const { data } = await supabase.from("courses").select(COURSE_SELECT).in("id", extraIds).in("status", ["published", "closed"]);
    extra = (data ?? []) as CourseWithInstructor[];
  }
  const all = new Map<string, CourseWithInstructor>();
  for (const c of [...((own ?? []) as CourseWithInstructor[]), ...extra]) all.set(c.id, sortLineup(c));
  return {
    instructor: instructor as Instructor | null,
    courses: [...all.values()].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function listBranches() {
  const supabase = await createClient();
  const { data } = await supabase.from("branches").select("name").eq("active", true).order("sort_order").order("name");
  return (data ?? []).map((b) => b.name as string);
}

export async function listNotices(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("*")
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Notice[];
}
