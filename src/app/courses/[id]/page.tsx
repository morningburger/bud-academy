import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourse, listSessions } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { AudienceBadge, CourseThumb } from "@/components/course-card";
import { SellerBadge } from "@/components/badges";
import { Avatar } from "@/components/avatar";
import { ACADEMY_ADDRESS, ACADEMY_MAP_LINKS, ENROLLMENT_STATUS_LABEL, FORMAT_LABEL, TRACK_LABEL, affiliationLine, applyOpen, cancelLastDay, cancelWindowOpen, coursePrice, formatDate, formatRange, todayKST } from "@/lib/format";
import { CancelPolicy } from "@/components/cancel-policy";
import { CancelRequest } from "@/components/cancel-request";
import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/types";
import { ApplyForm } from "./apply-form";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = /^[0-9a-f-]{36}$/i.test(id) ? await getCourse(id) : null;
  if (!course) return { title: "강좌" };
  return {
    title: course.title,
    description: course.summary ?? undefined,
    openGraph: { title: course.title, description: course.summary ?? undefined, images: course.thumbnail_url ? [course.thumbnail_url] : undefined },
  };
}

const STEP_TRACKS = new Set(["guest", "brand", "leadership"]);

/** 여러 날에 걸친 회차가 있으면 다회차 규정 안내 */
function nextOpenIsMulti(sessions: { starts_on: string | null; ends_on: string | null }[]) {
  return sessions.some((s) => s.starts_on && s.ends_on && s.ends_on !== s.starts_on);
}

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [course, viewer] = await Promise.all([getCourse(id), getViewer()]);
  if (!course) notFound();
  const sessions = await listSessions(id);

  type MyEnrollment = { id: string; status: EnrollmentStatus; session_id: string | null; cancel_requested_at: string | null };
  let myEnrollment: MyEnrollment | null = null;
  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("id, status, session_id, cancel_requested_at")
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
  const applicableSessions = openSessions.filter((s) => applyOpen(s.apply_deadline));
  const waitingNextRound = sessions.length > 0 && applicableSessions.length === 0;
  const mySession = myEnrollment?.session_id ? sessions.find((x) => x.id === myEnrollment!.session_id) : undefined;
  const myLastDay = cancelLastDay(mySession?.starts_on, course.cancel_deadline_days);
  const price = coursePrice(course, viewer);
  const isFree = !price.hidden && price.main === "무료";
  const policy = <CancelPolicy days={course.cancel_deadline_days} multiSession={Boolean(nextOpenIsMulti(sessions))} free={isFree} compact />;
  // 일정: 모집 중인 반 먼저, 끝난 반은 접어서
  const today = todayKST();
  const isPastSession = (x: (typeof sessions)[number]) =>
    x.status === "closed" || (x.status === "open" && !applyOpen(x.apply_deadline)) || Boolean(x.ends_on && x.ends_on < today) || Boolean(!x.ends_on && x.starts_on && x.starts_on < today);
  const currentSessions = sessions.filter((x) => !isPastSession(x));
  const pastSessions = sessions.filter(isPastSession).reverse();
  const numbered = STEP_TRACKS.has(course.track);
  const nextOpen = openSessions[0];

  const facts: { label: string; value: string; sub?: string | null }[] = [
    { label: "일정", value: course.schedule_summary ?? (nextOpen ? formatRange(nextOpen.starts_on, nextOpen.ends_on) ?? "회차별 안내" : "회차별 안내") },
    { label: "장소", value: course.location ?? (course.format === "online" ? "온라인" : "회차별 안내"), sub: course.format === "online" ? null : "인천 남동구 문화로 141 정현빌딩" },
    { label: "대상", value: course.audience ?? "누구나" },
    { label: "교육비", value: price.main, sub: price.hidden ? "버드아카데미로 문의해 주세요" : price.detail },
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
            <AudienceBadge internalOnly={course.internal_only} />
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
              {currentSessions.length > 0 ? (
                <ul className="divide-y divide-line border-y border-line">
                  {currentSessions.map((x) => {
                    const full = x.capacity !== null && x.taken >= x.capacity;
                    const when = formatRange(x.starts_on, x.ends_on);
                    return (
                      <li key={x.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{x.label}</p>
                          <p className="mt-1 text-[14px] text-ink-2">
                            <span className="text-muted">수업</span>{" "}
                            {when ? [when, x.schedule_text].filter(Boolean).join(" · ") : <><b className="font-semibold text-orange">수업일 확정 전</b>{x.schedule_text ? ` · ${x.schedule_text}` : ""}</>}
                          </p>
                          {x.location && <p className="text-[14px] text-ink-2"><span className="text-muted">장소</span> {x.location}</p>}
                          {x.apply_deadline && <p className="text-[14px] text-blue"><span className="text-muted">신청 마감</span> {formatDate(x.apply_deadline)}</p>}
                        </div>
                        {full ? (
                          <span className="chip-gray shrink-0">정원 마감</span>
                        ) : x.capacity ? (
                          <span className="chip-blue shrink-0">{x.capacity - x.taken}자리 남음</span>
                        ) : (
                          <span className="chip-blue shrink-0">모집 중</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl bg-surface px-5 py-4 text-[15px] text-sub">지금 모집 중인 반이 없어요. 다음 반이 열리면 이곳에 안내해요.</p>
              )}
              {currentSessions.some((x) => !x.starts_on) && (
                <p className="mt-3 text-[13px] text-muted">수업일이 정해지면 이 화면과 내 강의실에 바로 표시돼요.</p>
              )}
              {pastSessions.length > 0 && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer list-none text-[14px] font-semibold text-sub hover:text-ink">
                    지난 일정 {pastSessions.length}개 보기 <span aria-hidden className="inline-block transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <ul className="mt-2 divide-y divide-line border-y border-line">
                    {pastSessions.map((x) => (
                      <li key={x.id} className="py-3 flex items-center justify-between gap-4 text-[14px]">
                        <div className="min-w-0">
                          <p className="font-medium text-ink-2">{x.label}</p>
                          <p className="text-muted">{[formatRange(x.starts_on, x.ends_on), x.schedule_text].filter(Boolean).join(" · ")}</p>
                        </div>
                        <span className="chip-gray shrink-0">종료</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}

          {course.format !== "online" && (
            <section className="mt-12">
              <h2 className="text-[20px] font-bold mb-3">오시는 길</h2>
              <div className="rounded-2xl bg-surface p-5">
                <p className="font-bold">버드아카데미 교육장</p>
                <p className="mt-1 text-[15px] text-ink-2">{ACADEMY_ADDRESS}</p>
                {course.location && <p className="text-[14px] text-sub">강의실 · {course.location}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={ACADEMY_MAP_LINKS.naver} target="_blank" rel="noopener noreferrer" className="btn-gray btn-sm">네이버 지도</a>
                  <a href={ACADEMY_MAP_LINKS.kakao} target="_blank" rel="noopener noreferrer" className="btn-gray btn-sm">카카오맵</a>
                </div>
              </div>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-[20px] font-bold mb-3">{isFree ? "취소 규정" : "취소·환불 규정"}</h2>
            <div className="rounded-2xl bg-surface p-5">
              <CancelPolicy days={course.cancel_deadline_days} multiSession={Boolean(nextOpenIsMulti(sessions))} free={isFree} />
            </div>
          </section>

          {!course.is_official && (
            <p className="mt-8 text-[12px] leading-relaxed text-muted">
              이 강좌의 판매자는 {instructor?.name} 강사이며, 버드아카데미는 통신판매중개자로서 강좌 내용과 진행의 당사자가 아닙니다.
            </p>
          )}
        </div>

        <aside id="apply" className="lg:sticky lg:top-20 self-start panel p-5 scroll-mt-20">
          <p className="text-[14px] text-sub">{course.title}</p>
          <p className={`mt-1 text-[24px] font-extrabold tracking-[-0.03em] ${price.hidden ? "text-sub" : ""}`}>{price.main}</p>
          {price.detail && <p className="text-[13px] text-sub">{price.detail}</p>}
          {price.hidden && (
            <p className="mt-1 text-[13px] text-sub">
              고정현헤어 사내 교육이에요. {viewer ? "교육비는 버드아카데미로 문의해 주세요." : "고정현헤어 소속이면 로그인 후 확인할 수 있어요."}
            </p>
          )}
          <div className="mt-5">
            {myEnrollment !== null ? (
              <div className="rounded-2xl bg-blue-weak p-5">
                <p className="font-bold text-blue mb-1">
                  {myEnrollment.status === "approved" && myEnrollment.cancel_requested_at ? "취소 요청 중" : ENROLLMENT_STATUS_LABEL[myEnrollment.status]}
                </p>
                <p className="text-[15px] text-ink-2">
                  {myEnrollment.status === "requested" && "신청이 접수됐어요. 담당자가 확인하고 있어요."}
                  {myEnrollment.status === "approved" && "수강이 확정됐어요."}
                  {myEnrollment.status === "completed" && "수료한 강좌예요."}
                  {mySession && ` (${mySession.label})`}
                </p>
                {myEnrollment.status === "approved" && (
                  <CancelRequest
                    id={myEnrollment.id}
                    requested={Boolean(myEnrollment.cancel_requested_at)}
                    windowOpen={cancelWindowOpen(mySession?.starts_on, course.cancel_deadline_days)}
                    lastDayText={myLastDay ? formatDate(myLastDay) : null}
                  />
                )}
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
                profileComplete={Boolean(viewer?.profileComplete)}
                applicant={viewer?.profileComplete ? { name: viewer.name!, phone: viewer.phone!, line: affiliationLine(viewer.orgType, viewer.branch, viewer.jobTitle) } : null}
                blockedReason={course.internal_only && viewer?.orgType === "external" ? "고정현헤어 소속만 신청할 수 있는 사내 과정이에요." : null}
                closed={course.status !== "published"}
                policy={policy}
                sessions={openSessions.map((s) => {
                  const full = s.capacity !== null && s.taken >= s.capacity;
                  return {
                    id: s.id,
                    label: s.label,
                    detail: [formatRange(s.starts_on, s.ends_on) ?? "수업일 확정 전", s.schedule_text].filter(Boolean).join(" · ") || null,
                    full,
                    deadlinePassed: !applyOpen(s.apply_deadline),
                    deadlineText: s.apply_deadline ? `${formatDate(s.apply_deadline)}까지 신청` : null,
                    seatsLeft: s.capacity !== null ? Math.max(0, s.capacity - s.taken) : null,
                  };
                })}
              />
            )}
          </div>
        </aside>
      </div>

      {/* 모바일: 신청 영역으로 바로 가는 하단 바 */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold tracking-[-0.03em]">{price.main}</p>
          <p className="text-[12px] text-sub truncate">{price.detail ?? course.schedule_summary ?? ""}</p>
        </div>
        <a href="#apply" className="btn-primary px-6">
          {myEnrollment ? "신청 현황" : waitingNextRound || course.status !== "published" ? "모집 안내" : "신청하기"}
        </a>
      </div>
      <div className="lg:hidden h-20" aria-hidden />
    </div>
  );
}
