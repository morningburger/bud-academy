import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[480px] px-4 pt-24 text-center">
      <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">찾는 페이지가 없어요</h1>
      <p className="mt-2 text-sub">주소가 바뀌었거나 아직 공개되지 않은 페이지예요.</p>
      <Link href="/" className="btn-primary mt-8">처음으로</Link>
    </div>
  );
}
