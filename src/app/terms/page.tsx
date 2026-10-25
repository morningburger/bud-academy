import type { Metadata } from "next";

export const metadata: Metadata = { title: "이용약관" };

// TODO(운영): 법률 검토를 거친 정식 약관으로 교체
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10 text-[15px] leading-[1.8] text-ink-2">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em] text-ink mb-2">이용약관</h1>
      <p className="mb-8 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#a35f00]">초안입니다. 정식 약관은 검토 후 게시됩니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">제1조 (목적)</h2>
      <p>이 약관은 버드아카데미(이하 &lsquo;회사&rsquo;)가 운영하는 교육 중개 플랫폼에서 회원, 강사, 회사 사이의 권리와 의무를 정합니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">제2조 (플랫폼의 지위)</h2>
      <p>회사는 입점 강사가 개설한 강좌에 대해 통신판매중개자이며, 해당 강좌의 판매자는 강사입니다. 회사가 직접 운영하는 강좌는 &lsquo;직영&rsquo;으로 표시하며, 이 경우 회사가 판매자입니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">제3조 (수강 신청과 확정)</h2>
      <p>수강 신청은 신청 자격과 정원을 확인한 뒤 즉시 확정됩니다. 정원이 찬 회차와 신청 마감일이 지난 회차는 신청할 수 없습니다. 교육비와 납부 방법은 강좌별로 안내합니다.</p>
      <h2 className="font-bold text-ink mt-6 mb-1">제4조 (취소와 환불)</h2>
      <p>환불 기준은 강좌별로 안내하며, 관련 법령에서 정한 기준보다 수강생에게 불리하게 정하지 않습니다.</p>
    </article>
  );
}
