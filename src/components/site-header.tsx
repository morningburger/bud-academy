import Link from "next/link";
import { getViewer } from "@/lib/auth";

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1040px] px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/" className="shrink-0" aria-label="버드아카데미 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="버드아카데미" className="h-7 w-auto" />
        </Link>
        <nav className="hidden sm:flex items-center gap-5 text-[15px] text-sub">
          <Link href="/courses" className="hover:text-ink">강좌</Link>
          <Link href="/instructors" className="hover:text-ink">강사</Link>
          <Link href="/notices" className="hover:text-ink">공지사항</Link>
          <Link href="/partner" className="hover:text-ink">강사로 참여하기</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <>
              {viewer.isAdmin && <Link href="/admin" className="btn-gray btn-sm">관리자</Link>}
              {viewer.instructor && <Link href="/studio" className="btn-gray btn-sm">강사 스튜디오</Link>}
              <Link href="/me" className="btn-weak btn-sm">내 강의실</Link>
            </>
          ) : (
            <Link href="/login" className="btn-weak btn-sm">로그인</Link>
          )}
        </div>
      </div>
      <nav className="sm:hidden mx-auto max-w-[1040px] px-4 h-11 flex items-center gap-5 text-[15px] text-sub overflow-x-auto">
        <Link href="/courses">강좌</Link>
        <Link href="/instructors">강사</Link>
        <Link href="/notices">공지사항</Link>
        <Link href="/partner" className="whitespace-nowrap">강사로 참여하기</Link>
      </nav>
    </header>
  );
}
