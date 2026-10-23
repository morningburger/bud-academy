import Link from "next/link";
import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { INSTRUCTOR_STATUS_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "강사 입점 안내" };

const STEPS = [
  { title: "입점 신청", body: "강사 소개와 경력, 열고 싶은 강좌를 적어 보내주세요." },
  { title: "심사", body: "버드아카데미 교육팀이 경력과 강좌 계획을 검토하고 연락드려요." },
  { title: "강좌 개설", body: "승인되면 강사 스튜디오에서 강좌와 일정을 직접 등록해요. 공개 전 한 번 더 검수합니다." },
  { title: "수강생 관리", body: "신청이 들어오면 스튜디오에서 바로 확인하고 수강을 확정할 수 있어요." },
];

export default async function PartnerPage() {
  const viewer = await getViewer();
  const instructor = viewer?.instructor;

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-12">
      <h1 className="text-[32px] sm:text-[40px] font-extrabold leading-tight tracking-[-0.045em]">
        현장의 기술을
        <br />
        강좌로 만들어 보세요
      </h1>
      <p className="mt-4 text-[17px] text-sub leading-relaxed">
        모객 페이지, 신청 접수, 수강생 관리를 버드아카데미가 맡고, 강사님은 가르치는 일에 집중하시면 돼요.
      </p>

      <ol className="mt-10 flex flex-col">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 pb-7 relative">
            <span className="shrink-0 size-8 rounded-full bg-blue text-white text-[14px] font-bold grid place-items-center z-10">{i + 1}</span>
            {i < STEPS.length - 1 && <span className="absolute left-4 top-8 bottom-0 w-px bg-line" aria-hidden />}
            <div className="pt-1">
              <p className="font-bold">{s.title}</p>
              <p className="text-[15px] text-sub mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-2xl bg-surface p-5 text-[14px] text-sub leading-relaxed">
        수강료 정산과 플랫폼 수수료는 승인 후 개별 안내드려요. 온라인 결제는 준비 중이며, 그 전까지는 계좌 입금으로 신청을 확정합니다.
      </div>

      <div className="mt-8">
        {instructor ? (
          <div className="panel p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] text-sub">내 입점 상태</p>
              <p className="text-[18px] font-bold">{INSTRUCTOR_STATUS_LABEL[instructor.status]}</p>
            </div>
            {instructor.status === "approved" ? (
              <Link href="/studio" className="btn-primary">강사 스튜디오로</Link>
            ) : (
              <Link href="/partner/apply" className="btn-gray">신청서 수정</Link>
            )}
          </div>
        ) : (
          <Link href="/partner/apply" className="btn-primary btn-lg w-full">입점 신청하기</Link>
        )}
      </div>
    </div>
  );
}
