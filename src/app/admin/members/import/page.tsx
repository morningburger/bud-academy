import Link from "next/link";
import type { Metadata } from "next";
import { ImportForm } from "./form";

export const metadata: Metadata = { title: "기존 회원 가져오기" };

export default function ImportPage() {
  return (
    <div className="max-w-[640px]">
      <Link href="/admin/members/legacy" className="text-[14px] text-sub hover:text-ink">‹ 기존 사이트 명단</Link>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em]">기존 회원 가져오기</h1>
      <ol className="mt-4 mb-6 flex flex-col gap-2 text-[15px] text-ink-2 list-decimal pl-5">
        <li>기존 사이트(라이브클래스) 관리 &gt; 회원 관리 &gt; 가입 회원에서 <b>내보내기</b>로 엑셀을 받아요.</li>
        <li>받은 파일을 그대로 여기에 올려요. 같은 파일을 다시 올려도 중복되지 않고 최신 내용으로 바뀌어요.</li>
        <li>‘(지점명) 이름 직급’ 형식의 이름은 지점·이름·직급으로 자동으로 나눠요.</li>
        <li>기존 회원이 <b>같은 이메일로 가입</b>하면 소속·직급·연락처가 자동으로 채워지고 ‘기존 회원’ 표시가 붙어요. 비밀번호는 옮길 수 없어서 새로 정해야 해요.</li>
      </ol>
      <ImportForm />
      <p className="mt-4 text-[13px] text-muted">올린 명단은 운영진만 볼 수 있어요. 파일은 서버에 따로 보관하지 않아요.</p>
    </div>
  );
}
