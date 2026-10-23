import { createClient } from "./supabase/server";
import type { CourseSession, CourseWithInstructor, Instructor } from "./types";

const COURSE_SELECT = "*, instructor:instructors(*)";

export async function listPublicCourses(category?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("courses")
    .select(COURSE_SELECT)
    .in("status", ["published", "closed"])
    .order("is_official", { ascending: false })
    .order("published_at", { ascending: false });
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CourseWithInstructor[];
}

export async function getCourse(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select(COURSE_SELECT).eq("id", id).maybeSingle();
  return data as CourseWithInstructor | null;
}

export async function listSessions(courseId: string) {
  const supabase = await createClient();
  const [{ data: sessions }, { data: seats }] = await Promise.all([
    supabase
      .from("course_sessions")
      .select("*")
      .eq("course_id", courseId)
      .neq("status", "canceled")
      .order("starts_on", { ascending: true, nullsFirst: false }),
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
    .select("*, course:courses!inner(id, title, category, is_official, format, status, instructor:instructors(name, affiliation))")
    .eq("status", "open")
    .eq("course.status", "published")
    .gte("starts_on", today)
    .order("starts_on", { ascending: true })
    .limit(limit);
  return (data ?? []) as (CourseSession & {
    course: { id: string; title: string; category: string; is_official: boolean; format: string;
      instructor: { name: string; affiliation: string } | null };
  })[];
}

export async function listApprovedInstructors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("*")
    .eq("status", "approved")
    .order("affiliation", { ascending: true })
    .order("approved_at", { ascending: true });
  return (data ?? []) as Instructor[];
}

export async function getInstructor(id: string) {
  const supabase = await createClient();
  const [{ data: instructor }, { data: courses }] = await Promise.all([
    supabase.from("instructors").select("*").eq("id", id).maybeSingle(),
    supabase.from("courses").select(COURSE_SELECT).eq("instructor_id", id).in("status", ["published", "closed"]),
  ]);
  return {
    instructor: instructor as Instructor | null,
    courses: (courses ?? []) as CourseWithInstructor[],
  };
}
