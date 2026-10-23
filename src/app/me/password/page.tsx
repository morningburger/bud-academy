import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { PasswordForm } from "./form";

export const metadata: Metadata = { title: "비밀번호 변경" };

export default async function PasswordPage() {
  const viewer = await requireViewer("/me/password");
  return (
    <div className="mx-auto max-w-[400px] px-4 pt-14">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">새 비밀번호 정하기</h1>
      <p className="mt-2 mb-8 text-[15px] text-sub">{viewer.email} 계정의 비밀번호를 바꿔요.</p>
      <PasswordForm />
    </div>
  );
}
