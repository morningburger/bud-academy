import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCourses } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { CourseCard } from "@/components/course-card";
import { TRACK_LABEL, isRecruiting } from "@/lib/format";

export const metadata: Metadata = { title: "강좌" };

const TRACKS = ["level", "trend", "guest", "brand", "leadership", "special"] as const;

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const sp = await searchParams;
  const active = typeof sp.track === "string" && sp.track in TRACK_LABEL ? sp.track : undefined;
  const onlyOpen = sp.open === "1";
  const onlyPublic = sp.who === "all";
  const [all, viewer] = await Promise.all([listPublicCourses(active), getViewer()]);

  const published = all.filter((c) => c.status === "published" && (!onlyPublic || !c.internal_only));
  // 지금 신청할 수 있는 강좌를 앞으로
  const ranked = published
    .map((c, i) => ({ c, i, open: isRecruiting(c, c.sessions) }))
    .sort((a, b) => Number(b.open) - Number(a.open) || a.i - b.i);
  const courses = ranked.filter((r) => !onlyOpen || r.open).map((r) => r.c);
  const past = all.filter((c) => c.status === "closed" && (!onlyPublic || !c.internal_only));

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { track: active, open: onlyOpen ? "1" : undefined, who: onlyPublic ? "all" : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `/courses?${s}` : "/courses";
  };

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">강좌</h1>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link href={href({ track: undefined })} className={`${!active ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>전체</Link>
        {TRACKS.map((key) => (
          <Link key={key} href={href({ track: key })} className={`${active === key ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>
            {TRACK_LABEL[key]}
          </Link>
        ))}
      </div>
      <div className="mt-3 mb-8 flex flex-wrap gap-2 text-[14px]">
        <Link href={href({ open: onlyOpen ? undefined : "1" })} aria-pressed={onlyOpen}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 h-9 font-semibold ${onlyOpen ? "border-blue bg-blue-weak text-blue" : "border-line text-sub hover:text-ink"}`}>
          <span aria-hidden>{onlyOpen ? "✓" : "+"}</span> 모집 중만 보기
        </Link>
        <Link href={href({ who: onlyPublic ? undefined : "all" })} aria-pressed={onlyPublic}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 h-9 font-semibold ${onlyPublic ? "border-blue bg-blue-weak text-blue" : "border-line text-sub hover:text-ink"}`}>
          <span aria-hidden>{onlyPublic ? "✓" : "+"}</span> 다른 살롱도 신청 가능
        </Link>
      </div>
      {courses.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sub">조건에 맞는 모집 중 강좌가 없어요.</div>
      ) : (
        <div className="grid gap-x-5 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} viewer={viewer} />)}
        </div>
      )}

      <Link href="/suggest" className="mt-14 flex items-center justify-between gap-4 rounded-2xl bg-blue-weak px-5 py-5 hover:brightness-[0.98]">
        <span>
          <span className="block font-bold text-ink">찾는 교육이 없나요?</span>
          <span className="block text-[14px] text-sub mt-0.5">듣고 싶은 교육이나 모시고 싶은 강사를 알려 주세요</span>
        </span>
        <span className="btn-primary btn-sm shrink-0">건의하기</span>
      </Link>

      {past.length > 0 && !onlyOpen && (
        <section id="past" className="mt-16 scroll-mt-20">
          <h2 className="text-[20px] font-bold">지난 교육</h2>
          <p className="mt-1 mb-6 text-[14px] text-sub">버드아카데미에서 진행한 교육이에요. 다시 열리면 이곳에서 신청할 수 있어요.</p>
          <div className="grid gap-x-5 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((c) => <CourseCard key={c.id} course={c} viewer={viewer} />)}
          </div>
        </section>
      )}
    </div>
  );
}
