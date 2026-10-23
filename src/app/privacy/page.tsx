import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침" };

// TODO(운영): 실제 처리 현황(위탁사, 보관 기간, 책임자)으로 확정
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10 text-[15px] leading-[1.8] text-ink-2">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em] text-ink mb-2">개인정보처리방침</h1>
      <p className="mb-8 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#a35f00]">초안입니다. 정식 방침은 검토 후 게시됩니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">수집하는 항목</h2>
      <p>회원가입: 이름, 이메일, 비밀번호, 휴대폰 번호(선택). 수강 신청: 이름, 휴대폰 번호, 남긴 메시지. 강사 입점: 활동명, 소속, 경력, 소개, 프로필 사진, 인스타그램 계정.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">이용 목적</h2>
      <p>회원 식별, 수강 신청 접수와 안내, 강사 심사와 프로필 공개.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">제3자 제공</h2>
      <p>입점 강사의 강좌에 신청하면, 신청 처리를 위해 이름과 휴대폰 번호, 남긴 메시지가 해당 강사에게 제공됩니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">처리 위탁</h2>
      <p>데이터 보관: Supabase Inc. / 웹사이트 운영: Vercel Inc.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">보관 기간</h2>
      <p>회원 탈퇴 시 지체 없이 파기하며, 관계 법령에 따라 보관해야 하는 정보는 해당 기간 동안 보관합니다.</p>
    </article>
  );
}
