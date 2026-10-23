import { createClient } from "@/lib/supabase/server";
import type { Course, CourseSession, Enrollment, Instructor } from "@/lib/types";

export async function loadManagedCourse(id: string) {
  const supabase = await createClient();
  const [{ data: course }, { data: sessions }, { data: enrollments }] = await Promise.all([
    supabase.from("courses").select("*, instructor:instructors!courses_instructor_id_fkey(id, name, user_id)").eq("id", id).maybeSingle(),
    supabase.from("course_sessions").select("*").eq("course_id", id).order("starts_on", { ascending: true, nullsFirst: false }).order("label", { ascending: true }),
    supabase.from("enrollments").select("*").eq("course_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    course: course as (Course & { instructor: Pick<Instructor, "id" | "name" | "user_id"> | null }) | null,
    sessions: (sessions ?? []) as CourseSession[],
    enrollments: (enrollments ?? []) as Enrollment[],
  };
}

export async function loadInstructorOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("instructors").select("id, name").eq("status", "approved").order("name");
  return (data ?? []) as Pick<Instructor, "id" | "name">[];
}
