import type { Metadata } from "next";
import { SignupForm } from "../login/auth-forms";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  const n = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <div className="mx-auto max-w-[400px] px-4 pt-14">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em] mb-8">회원가입</h1>
      <SignupForm next={n} />
    </div>
  );
}
