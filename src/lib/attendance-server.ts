import { createClient } from "./supabase/server";
import type { Viewer } from "./auth";
import type { CourseSession } from "./types";
import type { AttendanceMark, ClassDay, RosterStudent } from "./attendance";

/** 출석부 한 회차를 통째로 불러온다. 권한이 없으면 null */
export async function loadAttendanceBook(sessionId: string, viewer: Viewer) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("course_sessions")
    .select("*, course:courses(id, title, instructor:instructors!courses_instructor_id_fkey(user_id), lineup:course_instructors(instructor_id))")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const s = session as CourseSession & {
    course: { id: string; title: string; instructor: { user_id: string | null } | null; lineup: { instructor_id: string }[] } | null;
  };
  if (!s.course) return null;
  const teaches =
    s.course.instructor?.user_id === viewer.userId ||
    (viewer.instructor?.status === "approved" && s.course.lineup.some((l) => l.instructor_id === viewer.instructor!.id));
  if (!viewer.isAdmin && !teaches) return null;

  const [{ data: days }, { data: students }] = await Promise.all([
    supabase.from("class_days").select("id, session_id, class_date, title").eq("session_id", sessionId).order("class_date"),
    supabase
      .from("enrollments")
      .select("id, status, applicant_name, applicant_phone, applicant_org_type, applicant_branch, applicant_job_title")
      .eq("session_id", sessionId)
      .in("status", ["approved", "completed"])
      .order("applicant_name"),
  ]);
  const dayList = (days ?? []) as ClassDay[];
  const { data: marks } = dayList.length
    ? await supabase
        .from("attendance")
        .select("class_day_id, enrollment_id, status, note, checked_at")
        .in("class_day_id", dayList.map((d) => d.id))
    : { data: [] };

  return {
    session: s,
    course: { id: s.course.id, title: s.course.title },
    days: dayList,
    students: (students ?? []) as RosterStudent[],
    marks: (marks ?? []) as AttendanceMark[],
  };
}

