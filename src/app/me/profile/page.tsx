import Link from "next/link";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { listBranches } from "@/lib/queries";
import { ProfileForm } from "./form";

export const metadata: Metadata = { title: "회원 정보" };

export default async function ProfilePage({ searchParams }: PageProps<"/me/profile">) {
  const viewer = await requireViewer("/me/profile");
  const { next } = await searchParams;
  const n = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const branches = await listBranches();
  return (
    <div className="mx-auto max-w-[440px] px-4 pt-10">
      <Link href="/me" className="text-[14px] text-sub hover:text-ink">‹ 내 강의실</Link>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em]">회원 정보</h1>
      <p className="mt-1 mb-8 text-[15px] text-sub">
        {viewer.profileComplete
          ? "수강 신청 때 이 정보로 본인을 확인해요."
          : "수강 신청 전에 소속과 직급을 입력해 주세요. 본인 확인에 쓰여요."}
      </p>
      <ProfileForm
        branches={branches}
        next={n}
        marketing={viewer.marketingAgreed}
        defaults={{ name: viewer.name, phone: viewer.phone, orgType: viewer.orgType, branch: viewer.branch, jobTitle: viewer.jobTitle }}
      />
      <p className="mt-6 text-[13px] text-muted">이메일: {viewer.email}</p>
    </div>
  );
}
