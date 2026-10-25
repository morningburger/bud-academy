import { notFound } from "next/navigation";
import { getInstructor } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { Portrait } from "@/components/avatar";
import { SellerBadge } from "@/components/badges";
import { CourseCard } from "@/components/course-card";
import { TEAM_LABEL } from "@/lib/format";

export default async function InstructorPage({ params }: PageProps<"/instructors/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ instructor, courses }, viewer] = await Promise.all([getInstructor(id), getViewer()]);
  if (!instructor) notFound();
  const insta = instructor.instagram?.replace(/^@/, "");

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <div className="flex flex-col sm:flex-row sm:items-end gap-6">
        <Portrait name={instructor.name} url={instructor.photo_url} className="w-44 sm:w-56 rounded-2xl" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">{instructor.name}</h1>
            <SellerBadge isOfficial={false} instructor={instructor} />
            {instructor.team && <span className="chip bg-ink text-white">{TEAM_LABEL[instructor.team]}</span>}
          </div>
          {instructor.headline && <p className="text-sub mt-1">{instructor.headline}</p>}
          <p className="text-[14px] text-muted mt-1">
            {[instructor.affiliation === "gohair" && instructor.branch_name ? `고정현헤어 ${instructor.branch_name}` : null,
              insta ? `@${insta}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {(instructor.bio || instructor.career) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {instructor.bio && (
            <section><h2 className="font-bold mb-2">소개</h2><p className="text-ink-2 leading-[1.8] whitespace-pre-line">{instructor.bio}</p></section>
          )}
          {instructor.career && (
            <section><h2 className="font-bold mb-2">경력</h2><p className="text-ink-2 leading-[1.8] whitespace-pre-line">{instructor.career}</p></section>
          )}
        </div>
      )}
      <h2 className="mt-12 mb-5 text-[20px] font-bold">버드아카데미 강의</h2>
      {courses.length === 0 ? (
        <p className="text-sub">공개된 강좌가 아직 없어요.</p>
      ) : (
        <div className="grid gap-x-5 gap-y-9 grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={{ ...c, instructor }} viewer={viewer} />)}
        </div>
      )}
    </div>
  );
}
