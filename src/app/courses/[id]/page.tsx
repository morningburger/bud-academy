import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourse, listSessions } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { CourseThumb } from "@/components/course-card";
import { SellerBadge } from "@/components/badges";
import { Avatar } from "@/components/avatar";
import { ENROLLMENT_STATUS_LABEL, FORMAT_LABEL, TRACK_LABEL, formatPrice, formatRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/types";
import { ApplyForm } from "./apply-form";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = /^[0-9a-f-]{36}$/i.test(id) ? await getCourse(id) : null;
  return { title: course?.title ?? "강좌", description: course?.summary ?? undefined };
}

const STEP_TRACKS = new Set(["guest", "brand", "leadership"]);

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [course, viewer] = await Promise.all([getCourse(id), getViewer()]);
  if (!course) notFound();
  const sessions = await listSessions(id);

  type MyEnrollment = { status: EnrollmentStatus; session_id: string | null };
  let myEnrollment: MyEnrollment | null = null;
  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("status, session_id")
      .eq("course_id", id)
      .eq("user_id", viewer.userId)
      .neq("status", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    myEnrollment = (data as MyEnrollment | null) ?? null;
  }

  const isPublic = course.status === "published" || course.status === "closed";
  const instructor = course.instructor;
  const lineup = course.lineup ?? [];
  const openSessions = sessions.filter((s) => s.status === "open");
  const waitingNextRound = sessions.length > 0 && openSessions.length === 0;
  const numbered = STEP_TRACKS.has(course.track);
  const nextOpen = openSessions[0];

  const facts: { label: string; value: string; sub?: string | null }[] = [
    { label: "일정", value: course.schedule_summary ?? (nextOpen ? formatRange(nextOpen.starts_on, nextOpen.ends_on) ?? "회차별 안내" : "회차별 안내") },
    { label: "장소", value: course.location ?? (course.format === "online" ? "온라인" : "회차별 안내") },
    { label: "대상", value: course.audience ?? "누구나" },
    { label: "수강료", value: formatPrice(course.price), sub: course.price_note },
  ];

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-8">
      {!isPublic && (
        <div className="mb-6 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#a35f00]">미리보기 화면이에요. 이 강좌는 아직 공개되지 않았어요.</div>
      )}
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <CourseThumb course={course} className="aspect-[16/10] w-full rounded-3xl" />

          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            {course.level && <span className="chip bg-ink text-white">LV{course.level}</span>}
            <span className="chip-blue">{TRACK_LABEL[course.track]}</span>
            <SellerBadge isOfficial={course.is_official} instructor={instructor} />
            {course.format !== "offline" && <span className="chip-gray">{FORMAT_LABEL[course.format]}</span>}
          </div>
          <h1 className="mt-3 text-[28px] sm:text-[34px] font-extrabold leading-tight tracking-[-0.04em]">{course.title}</h1>
          {course.summary && <p className="mt-3 text-[17px] leading-relaxed text-sub">{course.summary}</p>}

          <dl className="mt-8 grid grid-cols-2 gap-2">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl bg-surface p-4">
                <dt className="text-[13px] text-muted">{f.label}</dt>
                <dd className="mt-1 font-bold leading-snug">{f.value}</dd>
                {f.sub && <dd className="mt-0.5 text-[13px] text-sub">{f.sub}</dd>}
              </div>
            ))}
          </dl>

          {course.eligibility && (
            <p className="mt-3 rounded-2xl border border-[#c9defc] bg-blue-weak px-4 py-3 text-[15px] text-[#1b4fa8]">
              <b className="font-bold">수강 자격</b> · {course.eligibility}
            </p>
          )}

          {course.description && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-3">어떤 과정인가요</h2>
              <p className="text-[16px] leading-[1.8] text-ink-2 whitespace-pre-line">{course.description}</p>
            </section>
          )}

          {course.curriculum.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-4">이런 걸 배워요</h2>
              <ol className="flex flex-col gap-2">
                {course.curriculum.map((item, i) => (
                  <li key={i} className="flex gap-4 rounded-2xl border border-line px-5 py-4">
                    {numbered && (
                      <span className="shrink-0 size-7 rounded-full bg-blue-weak text-blue text-[13px] font-bold grid place-items-center">{i + 1}</span>
                    )}
                    <div>
                      <p className="font-bold">{item.title}</p>
                      {item.detail && <p className="text-[14px] text-sub mt-0.5">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {course.materials.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-3">준비물</h2>
              <ul className="rounded-2xl bg-surface p-5 flex flex-col gap-2">
                {course.materials.map((m) => (
                  <li key={m} className="flex gap-2.5 text-[15px] text-ink-2">
                    <span aria-hidden className="mt-[7px] size-1.5 rounded-full bg-ink-2 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(lineup.length > 0 || (!course.is_official && instructor)) && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-4">{lineup.length > 1 ? "강사진" : "강사"}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {(lineup.length ? lineup.map((l) => ({ ...l.instructor!, role: l.role })) : [{ ...instructor!, role: null }]).map((p) => (
                  <li key={p.id}>
                    <Link href={`/instructors/${p.id}`} className="flex items-center gap-4 rounded-2xl bg-surface p-4 hover:bg-surface-strong">
                      <Avatar name={p.name} url={p.photo_url} size={52} />
                      <div className="min-w-0">
                        <p className="font-bold flex items-center gap-1.5">{p.name}<SellerBadge isOfficial={false} instructor={p} /></p>
                        <p className="text-[14px] text-sub truncate">{p.role ?? p.headline ?? ""}</p>
                        {p.branch_name && <p className="text-[13px] text-muted truncate">{p.affiliation === "gohair" ? `고정현헤어 ${p.branch_name}` : p.branch_name}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.gallery.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-4">자세히 보기</h2>
              <div className="flex flex-col gap-3">
                {course.gallery.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="w-full rounded-2xl border border-line bg-surface" loading="lazy" />
                ))}
              </div>
            </section>
          )}

          {sessions.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-3">진행 일정</h2>
              <ul className="divide-y divide-line border-y border-line">
                {sessions.map((s) => {
                  const full = s.capacity !== null && s.taken >= s.capacity;
                  return (
                    <li key={s.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold">{s.label}</p>
                        <p className="text-[14px] text-sub">
                          {[formatRange(s.starts_on, s.ends_on), s.schedule_text, s.location].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {s.status === "closed" ? (
                        <span className="chip-gray">마감</span>
                      ) : full ? (
                        <span className="chip-gray">정원 마감</span>
                      ) : s.capacity ? (
                        <span className="chip-blue">{s.capacity - s.taken}자리 남음</span>
                      ) : (
                        <span className="chip-blue">모집 중</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {!course.is_official && (
            <p className="mt-8 text-[12px] leading-relaxed text-muted">
              이 강좌의 판매자는 {instructor?.name} 강사이며, 버드아카데미는 통신판매중개자로서 강좌 내용과 진행의 당사자가 아닙니다.
            </p>
          )}
        </div>

        <aside id="apply" className="lg:sticky lg:top-20 self-start panel p-5 scroll-mt-20">
          <p className="text-[14px] text-sub">{course.title}</p>
          <p className="mt-1 text-[24px] font-extrabold tracking-[-0.03em]">{formatPrice(course.price)}</p>
          {course.price_note && <p className="text-[13px] text-sub">{course.price_note}</p>}
          <div className="mt-5">
            {myEnrollment !== null ? (
              <div className="rounded-2xl bg-blue-weak p-5">
                <p className="font-bold text-blue mb-1">{ENROLLMENT_STATUS_LABEL[myEnrollment.status]}</p>
                <p className="text-[15px] text-ink-2">
                  {myEnrollment.status === "requested" && "신청이 접수됐어요. 확인 후 입금 안내를 드려요."}
                  {myEnrollment.status === "approved" && "수강이 확정됐어요."}
                  {myEnrollment.status === "completed" && "수료한 강좌예요."}
                  {myEnrollment.session_id && ` (${sessions.find((s) => s.id === myEnrollment.session_id)?.label ?? ""})`}
                </p>
                <Link href="/me" className="btn-primary w-full mt-4">내 강의실에서 보기</Link>
              </div>
            ) : waitingNextRound && course.status === "published" ? (
              <div className="rounded-2xl bg-surface p-5 text-center">
                <p className="font-bold">지금 모집 중인 반이 없어요</p>
                <p className="mt-1 text-[14px] text-sub">다음 반이 열리면 이곳에서 바로 신청할 수 있어요.</p>
              </div>
            ) : (
              <ApplyForm
                courseId={course.id}
                signedIn={Boolean(viewer)}
                defaultName={viewer?.name ?? ""}
                defaultPhone={viewer?.phone ?? ""}
                closed={course.status !== "published"}
                sessions={openSessions.map((s) => ({
                  id: s.id,
                  label: s.label,
                  detail: [formatRange(s.starts_on, s.ends_on), s.schedule_text].filter(Boolean).join(" · ") || null,
                  full: s.capacity !== null && s.taken >= s.capacity,
                }))}
              />
            )}
          </div>
        </aside>
      </div>

      {/* 모바일: 신청 영역으로 바로 가는 하단 바 */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold tracking-[-0.03em]">{formatPrice(course.price)}</p>
          <p className="text-[12px] text-sub truncate">{course.price_note ?? course.schedule_summary ?? ""}</p>
        </div>
        <a href="#apply" className="btn-primary px-6">
          {myEnrollment ? "신청 현황" : waitingNextRound || course.status !== "published" ? "모집 안내" : "신청하기"}
        </a>
      </div>
      <div className="lg:hidden h-20" aria-hidden />
    </div>
  );
}
