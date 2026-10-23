"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { applyToCourse, type ApplyState } from "./actions";

interface SessionOption {
  id: string;
  label: string;
  detail: string | null;
  full: boolean;
}

export function ApplyForm({
  courseId,
  sessions,
  signedIn,
  defaultName,
  defaultPhone,
  closed,
}: {
  courseId: string;
  sessions: SessionOption[];
  signedIn: boolean;
  defaultName: string;
  defaultPhone: string;
  closed: boolean;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToCourse, null);
  const firstOpen = sessions.find((s) => !s.full)?.id ?? "";
  const [sessionId, setSessionId] = useState(firstOpen);

  if (closed) {
    return <div className="rounded-2xl bg-surface p-5 text-center text-sub">지금은 모집이 마감된 강좌예요.</div>;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-2">
        <Link href={`/login?next=/courses/${courseId}`} className="btn-primary btn-lg w-full">로그인하고 신청하기</Link>
        <p className="text-center text-[13px] text-muted">처음이라면 30초면 가입할 수 있어요</p>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-blue-weak p-5">
        <p className="font-bold text-blue mb-1">신청 완료</p>
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
            {sessions.map((s) => (
              <label
                key={s.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  s.full ? "opacity-50 cursor-not-allowed border-line" :
                  sessionId === s.id ? "border-blue bg-blue-weak" : "border-line hover:bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="session_id"
                  value={s.id}
                  disabled={s.full}
                  checked={sessionId === s.id}
                  onChange={() => setSessionId(s.id)}
                  className="mt-1 accent-[#3182f6]"
                />
                <span>
                  <span className="block text-[15px] font-semibold text-ink">
                    {s.label} {s.full && <span className="chip-gray ml-1">정원 마감</span>}
                  </span>
                  {s.detail && <span className="block text-[13px] text-sub mt-0.5">{s.detail}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label" htmlFor="name">이름</label>
          <input id="name" name="name" className="input" defaultValue={defaultName} required autoComplete="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">휴대폰</label>
          <input id="phone" name="phone" className="input" defaultValue={defaultPhone} required inputMode="tel" autoComplete="tel" placeholder="01012345678" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="message">남길 말 (선택)</label>
        <textarea id="message" name="message" rows={2} className="input textarea-input" placeholder="경력, 근무 지점, 궁금한 점" />
      </div>
      {state && !state.ok && <p className="text-[14px] text-red">{state.message}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending || noOpenSession}>
        {noOpenSession ? "모든 회차가 마감됐어요" : pending ? "신청하는 중" : "수강 신청하기"}
      </button>
      <p className="text-[12px] leading-relaxed text-muted">
        지금은 온라인 결제 없이 신청만 받아요. 신청이 확인되면 입금 계좌를 안내드리고, 입금 확인 후 수강이 확정됩니다.
      </p>
    </form>
  );
}
