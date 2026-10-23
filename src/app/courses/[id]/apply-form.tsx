"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { applyToCourse, type ApplyState } from "./actions";

interface SessionOption {
  id: string;
  label: string;
  detail: string | null;
  full: boolean;
  deadlinePassed: boolean;
  deadlineText: string | null;
  seatsLeft: number | null;
}

export function ApplyForm({
  courseId,
  sessions,
  signedIn,
  applicant,
  profileComplete,
  blockedReason,
  closed,
  policy,
}: {
  courseId: string;
  sessions: SessionOption[];
  signedIn: boolean;
  applicant: { name: string; line: string | null; phone: string } | null;
  profileComplete: boolean;
  blockedReason: string | null;
  closed: boolean;
  policy: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToCourse, null);
  const selectable = (s: SessionOption) => !s.full && !s.deadlinePassed;
  const firstOpen = sessions.find(selectable)?.id ?? "";
  const [sessionId, setSessionId] = useState(firstOpen);
  const next = `/courses/${courseId}`;

  if (closed) {
    return <div className="rounded-2xl bg-surface p-5 text-center text-sub">지금은 모집이 마감된 강좌예요.</div>;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-2">
        <Link href={`/login?next=${next}`} className="btn-primary btn-lg w-full">로그인하고 신청하기</Link>
        <p className="text-center text-[13px] text-muted">처음이라면 1분이면 가입할 수 있어요</p>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="rounded-2xl bg-surface p-5">
        <p className="font-bold">회원 정보를 먼저 입력해 주세요</p>
        <p className="mt-1 text-[14px] text-sub">수강 신청할 때 소속 지점과 직급으로 본인을 확인해요.</p>
        <Link href={`/me/profile?next=${encodeURIComponent(next)}`} className="btn-primary w-full mt-4">소속·직급 입력하기</Link>
      </div>
    );
  }

  if (blockedReason) {
    return <div className="rounded-2xl bg-surface p-5 text-center text-[15px] text-sub">{blockedReason}</div>;
  }

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-blue-weak p-5">
        <p className="font-bold text-blue mb-1">수강 확정</p>
        <p className="text-[15px] text-ink-2">{state.message}</p>
        <Link href="/me" className="btn-primary w-full mt-4">내 강의실에서 보기</Link>
      </div>
    );
  }

  const noOpenSession = sessions.length > 0 && !firstOpen;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="course_id" value={courseId} />
      {sessions.length > 0 && (
        <fieldset>
          <legend className="field-label">회차 선택</legend>
          <div className="flex flex-col gap-2">
            {sessions.map((s) => {
              const ok = selectable(s);
              return (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    !ok ? "opacity-50 cursor-not-allowed border-line" :
                    sessionId === s.id ? "border-blue bg-blue-weak cursor-pointer" : "border-line hover:bg-surface cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="session_id"
                    value={s.id}
                    disabled={!ok}
                    checked={sessionId === s.id}
                    onChange={() => setSessionId(s.id)}
                    className="mt-1 accent-[#3182f6]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink">
                      {s.label}{" "}
                      {s.full ? <span className="chip-gray ml-1">정원 마감</span> :
                        s.deadlinePassed ? <span className="chip-gray ml-1">신청 마감</span> :
                        s.seatsLeft !== null && s.seatsLeft <= 5 ? <span className="chip-orange ml-1">{s.seatsLeft}자리 남음</span> : null}
                    </span>
                    {s.detail && <span className="block text-[13px] text-sub mt-0.5">{s.detail}</span>}
                    {s.deadlineText && ok && <span className="block text-[12px] text-blue mt-0.5">{s.deadlineText}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {applicant && (
        <div className="rounded-xl bg-surface px-4 py-3 text-[14px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">신청자</span>
            <Link href={`/me/profile?next=${encodeURIComponent(next)}`} className="text-[13px] text-blue font-semibold">수정</Link>
          </div>
          <p className="mt-0.5 font-bold text-ink">{applicant.name}</p>
          <p className="text-sub">{[applicant.line, applicant.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")].filter(Boolean).join(" · ")}</p>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="message">남길 말 (선택)</label>
        <textarea id="message" name="message" rows={2} maxLength={500} className="input textarea-input" placeholder="궁금한 점이나 전달할 내용" />
      </div>

      <div className="rounded-xl border border-line px-4 py-3">
        <p className="text-[13px] font-bold text-ink mb-1.5">취소·환불 규정</p>
        {policy}
        <label className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-ink">
          <input type="checkbox" name="agree_policy" required className="accent-[#3182f6] size-4" />
          규정을 확인했어요
        </label>
      </div>

      {state && !state.ok && <p className="text-[14px] text-red">{state.message}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending || noOpenSession}>
        {noOpenSession ? "신청할 수 있는 회차가 없어요" : pending ? "신청하는 중" : "수강 신청하기"}
      </button>
    </form>
  );
}
