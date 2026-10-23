import type { Metadata } from "next";
import { ForgotForm } from "./form";

export const metadata: Metadata = { title: "비밀번호 찾기" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-[400px] px-4 pt-14">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">비밀번호 찾기</h1>
      <p className="mt-2 mb-8 text-[15px] text-sub">가입한 이메일로 비밀번호를 다시 정하는 링크를 보내 드려요.</p>
      <ForgotForm />
    </div>
  );
}
