import type { Metadata } from "next";
import { LoginForm } from "./auth-forms";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const n = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div className="mx-auto max-w-[400px] px-4 pt-14">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em] mb-8">로그인</h1>
      {error === "link" && (
        <p className="mb-5 rounded-xl bg-red-weak px-4 py-3 text-[14px] text-red">인증 링크가 만료됐거나 이미 사용됐어요. 다시 로그인해 주세요.</p>
      )}
      <LoginForm next={n} />
    </div>
  );
}
