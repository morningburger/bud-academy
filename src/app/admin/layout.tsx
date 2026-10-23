import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "관리자", template: "%s | 버드아카데미 관리자" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireAdmin();
  const supabase = await createClient();
  const [{ count: requests }, { count: pendingInstructors }, { count: pendingCourses }] = await Promise.all([
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "requested"),
    supabase.from("instructors").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-6 lg:pt-10 grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-20 self-start">
        <p className="hidden lg:block px-3.5 mb-3 text-[13px] text-muted">
          운영진 · {viewer.name ?? viewer.email}
        </p>
        <AdminNav
          badges={{
            "/admin/enrollments": requests ?? 0,
            "/admin/instructors": pendingInstructors ?? 0,
            "/admin/courses": pendingCourses ?? 0,
          }}
        />
      </aside>
      <div className="min-w-0 pb-10">{children}</div>
    </div>
  );
}
