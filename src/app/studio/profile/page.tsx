import type { Metadata } from "next";
import { requireApprovedInstructor } from "@/lib/auth";
import { InstructorForm } from "@/components/instructor-form";
import { saveInstructorProfile } from "@/app/partner/apply/actions";

export const metadata: Metadata = { title: "프로필 수정" };

export default async function StudioProfilePage() {
  const viewer = await requireApprovedInstructor();
  return (
    <div className="mx-auto max-w-[560px] px-4 pt-10">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em] mb-8">프로필 수정</h1>
      <InstructorForm action={saveInstructorProfile} instructor={viewer.instructor} submitLabel="저장하기" />
    </div>
  );
}
