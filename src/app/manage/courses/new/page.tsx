import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { CourseForm } from "@/components/course-form";
import { loadInstructorOptions } from "../../load";

export default async function NewCoursePage({ searchParams }: PageProps<"/manage/courses/new">) {
  const { official } = await searchParams;
  const viewer = await requireViewer("/manage/courses/new");
  if (!viewer.isAdmin && viewer.instructor?.status !== "approved") redirect("/partner");
  const instructors = viewer.isAdmin ? await loadInstructorOptions() : [];
  return (
    <div className="mx-auto max-w-[640px] px-4 pt-10">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">새 강좌</h1>
      <p className="mt-2 mb-8 text-sub">
        {viewer.isAdmin ? "저장 후 회차를 추가하고 공개하세요." : "저장한 뒤 회차를 추가하고 검수를 요청하세요. 승인되면 공개돼요."}
      </p>
      <CourseForm course={null} isAdmin={viewer.isAdmin} instructors={instructors} defaultOfficial={official === "1"} />
    </div>
  );
}
