import Link from "next/link";

// TODO(운영): 사업자 정보는 실제 등록 정보로 교체
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-surface">
      <div className="mx-auto max-w-[1040px] px-4 sm:px-6 py-10 text-[13px] leading-relaxed text-muted">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sub font-medium mb-5">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy" className="text-ink-2 font-semibold">개인정보처리방침</Link>
          <Link href="/partner">강사 입점 안내</Link>
        </div>
        <p className="text-ink-2 font-semibold mb-1">버드아카데미</p>
        <p>상호 버드아카데미 · 대표자 — · 사업자등록번호 — · 통신판매업 신고번호 —</p>
        <p>주소 — · 고객문의 —</p>
        <p className="mt-4 max-w-[720px]">
          버드아카데미는 강좌 중개 플랫폼입니다. 입점 강사가 개설한 강좌의 판매자는 각 강사이며, 강좌 내용과 진행에 대한 책임은
          판매자에게 있습니다. 버드아카데미가 직접 운영하는 강좌는 &lsquo;직영&rsquo;으로 표시됩니다.
        </p>
      </div>
    </footer>
  );
}
